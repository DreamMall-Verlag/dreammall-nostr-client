// =================================================================
// NIP-25: Reactions (Likes, Dislikes, Emojis)
// Handles reactions to events and messages
// =================================================================

export class NIP25_Reactions {
    constructor(nostrService, nip01) {
        this.nostrService = nostrService;
        this.nip01 = nip01;
        this.KIND_REACTION = 7;
        this.reactions = new Map(); // eventId -> reactions
        this.myReactions = new Map(); // eventId -> myReaction
    }

    /**
     * React to an event
     */
    async reactToEvent(eventId, reaction = '+', eventAuthor = '') {
        try {
            console.log(`👍 NIP-25 Reagiere auf Event: ${eventId.slice(0, 8)}... mit "${reaction}"`);
            
            // Create tags for the reaction
            const tags = [
                ['e', eventId],
                ['k', '1'] // Reacting to kind 1 (text note)
            ];
            
            // Add author tag if provided
            if (eventAuthor) {
                tags.push(['p', eventAuthor]);
            }
            
            // Create reaction event
            const event = await this.nip01.createTextNote(reaction, tags);
            event.kind = this.KIND_REACTION;
            
            // Re-calculate ID and signature
            event.id = this.nostrService.getEventHash(event);
            event.sig = await this.nostrService.signEvent(event);
            
            // Publish reaction
            await this.nip01.publish(event);
            
            // Update local state
            this.myReactions.set(eventId, reaction);
            this.updateEventReactions(eventId, reaction, 1);
            
            console.log('✅ NIP-25 Reaktion gesendet');
            return event;
            
        } catch (error) {
            console.error('❌ NIP-25 Reaktion Fehler:', error);
            throw error;
        }
    }

    /**
     * Remove reaction from event
     */
    async removeReaction(eventId) {
        try {
            console.log(`🗑️ NIP-25 Entferne Reaktion von Event: ${eventId.slice(0, 8)}...`);
            
            // In NOSTR, we can't directly delete, but we can send a delete event
            // For now, we'll just update local state
            const previousReaction = this.myReactions.get(eventId);
            
            if (previousReaction) {
                this.myReactions.delete(eventId);
                this.updateEventReactions(eventId, previousReaction, -1);
                
                console.log('✅ NIP-25 Reaktion entfernt (lokal)');
            }
            
        } catch (error) {
            console.error('❌ NIP-25 Reaktion entfernen Fehler:', error);
            throw error;
        }
    }

    /**
     * Like an event (shorthand for +)
     */
    async likeEvent(eventId, eventAuthor = '') {
        return this.reactToEvent(eventId, '+', eventAuthor);
    }

    /**
     * Dislike an event (shorthand for -)
     */
    async dislikeEvent(eventId, eventAuthor = '') {
        return this.reactToEvent(eventId, '-', eventAuthor);
    }

    /**
     * React with emoji
     */
    async emojiReact(eventId, emoji, eventAuthor = '') {
        return this.reactToEvent(eventId, emoji, eventAuthor);
    }

    /**
     * Subscribe to reactions for specific events
     */
    subscribeToReactions(eventIds, onReaction) {
        const filters = [
            {
                kinds: [this.KIND_REACTION],
                '#e': eventIds,
                since: Math.floor(Date.now() / 1000) - 3600 // Last hour
            }
        ];

        console.log('📡 NIP-25 Abonniere Reaktionen für Events:', eventIds.length);
        
        return this.nip01.subscribe(filters, (event) => {
            const processedReaction = this.processReaction(event);
            if (processedReaction) {
                onReaction(processedReaction);
            }
        });
    }

    /**
     * Process incoming reaction
     */
    processReaction(event) {
        try {
            if (event.kind !== this.KIND_REACTION) {
                return null;
            }

            // Find the event being reacted to
            const eTags = event.tags.filter(tag => tag[0] === 'e');
            const pTags = event.tags.filter(tag => tag[0] === 'p');
            
            if (eTags.length === 0) {
                console.warn('⚠️ NIP-25 Reaktion ohne e-tag');
                return null;
            }

            const targetEventId = eTags[0][1];
            const targetAuthor = pTags.length > 0 ? pTags[0][1] : '';
            const reaction = event.content;
            const reactorPubkey = event.pubkey;

            // Update local reaction count
            this.updateEventReactions(targetEventId, reaction, 1);

            return {
                ...event,
                targetEventId,
                targetAuthor,
                reaction,
                reactorPubkey,
                isReaction: true
            };
            
        } catch (error) {
            console.error('❌ NIP-25 Reaktion Processing Error:', error);
            return null;
        }
    }

    /**
     * Update event reaction counts
     */
    updateEventReactions(eventId, reaction, delta) {
        if (!this.reactions.has(eventId)) {
            this.reactions.set(eventId, new Map());
        }
        
        const eventReactions = this.reactions.get(eventId);
        const currentCount = eventReactions.get(reaction) || 0;
        eventReactions.set(reaction, Math.max(0, currentCount + delta));
    }

    /**
     * Get reactions for an event
     */
    getEventReactions(eventId) {
        const eventReactions = this.reactions.get(eventId);
        if (!eventReactions) {
            return {};
        }
        
        const result = {};
        eventReactions.forEach((count, reaction) => {
            if (count > 0) {
                result[reaction] = count;
            }
        });
        
        return result;
    }

    /**
     * Get my reaction to an event
     */
    getMyReaction(eventId) {
        return this.myReactions.get(eventId);
    }

    /**
     * Check if I reacted to an event
     */
    hasReacted(eventId) {
        return this.myReactions.has(eventId);
    }

    /**
     * Get reaction summary for an event
     */
    getReactionSummary(eventId) {
        const reactions = this.getEventReactions(eventId);
        const myReaction = this.getMyReaction(eventId);
        
        return {
            reactions,
            myReaction,
            totalReactions: Object.values(reactions).reduce((sum, count) => sum + count, 0),
            hasLikes: (reactions['+'] || 0) > 0,
            hasDislikes: (reactions['-'] || 0) > 0,
            likesCount: reactions['+'] || 0,
            dislikesCount: reactions['-'] || 0
        };
    }

    /**
     * Get popular reactions
     */
    getPopularReactions(limit = 10) {
        const allReactions = new Map();
        
        this.reactions.forEach((eventReactions) => {
            eventReactions.forEach((count, reaction) => {
                const current = allReactions.get(reaction) || 0;
                allReactions.set(reaction, current + count);
            });
        });
        
        return Array.from(allReactions.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([reaction, count]) => ({ reaction, count }));
    }

    /**
     * Load reactions for events
     */
    async loadReactionsForEvents(eventIds) {
        const filters = [
            {
                kinds: [this.KIND_REACTION],
                '#e': eventIds,
                limit: 1000
            }
        ];

        return new Promise((resolve) => {
            const reactions = [];
            
            const sub = this.nip01.subscribe(filters, (event) => {
                const processedReaction = this.processReaction(event);
                if (processedReaction) {
                    reactions.push(processedReaction);
                }
            });

            setTimeout(() => {
                try {
                    if (typeof sub.unsub === 'function') {
                        sub.unsub();
                    } else if (typeof sub.close === 'function') {
                        sub.close();
                    } else if (typeof sub.unsubscribe === 'function') {
                        sub.unsubscribe();
                    }
                } catch (unsubError) {
                    console.warn('⚠️ Fehler beim Beenden der Subscription (timeout):', unsubError);
                }
                resolve(reactions);
            }, 3000);
        });
    }

    /**
     * Get reaction statistics
     */
    getReactionStats() {
        const stats = {
            totalEvents: this.reactions.size,
            totalReactions: 0,
            myReactions: this.myReactions.size,
            reactionTypes: new Map()
        };
        
        this.reactions.forEach((eventReactions) => {
            eventReactions.forEach((count, reaction) => {
                stats.totalReactions += count;
                const current = stats.reactionTypes.get(reaction) || 0;
                stats.reactionTypes.set(reaction, current + count);
            });
        });
        
        return stats;
    }

    /**
     * Clear all reactions (local only)
     */
    clearReactions() {
        this.reactions.clear();
        this.myReactions.clear();
    }
}
