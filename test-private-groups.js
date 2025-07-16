// Test script for private groups functionality
// Open browser console and run: loadScript('/test-private-groups.js')

console.log('🧪 Testing Private Groups Functionality...');

// Test 1: Create a test private group
window.testCreatePrivateGroup = async () => {
    console.log('🔐 Test 1: Creating private group...');
    
    try {
        await window.createTestPrivateGroup();
        console.log('✅ Test 1 passed: Private group created successfully');
    } catch (error) {
        console.error('❌ Test 1 failed:', error);
    }
};

// Test 2: Check if private groups are displayed
window.testPrivateGroupsDisplay = () => {
    console.log('👀 Test 2: Checking private groups display...');
    
    const container = document.getElementById('privateGroupsList');
    if (!container) {
        console.error('❌ Test 2 failed: privateGroupsList container not found');
        return;
    }
    
    const groups = container.querySelectorAll('.private-group');
    console.log(`📊 Found ${groups.length} private groups displayed`);
    
    if (groups.length > 0) {
        console.log('✅ Test 2 passed: Private groups are displayed');
        groups.forEach((group, index) => {
            const name = group.querySelector('.group-name')?.textContent;
            const description = group.querySelector('.group-description')?.textContent;
            console.log(`  Group ${index + 1}: ${name} - ${description}`);
        });
    } else {
        console.log('ℹ️ Test 2: No private groups found (expected if none created)');
    }
};

// Test 3: Test UI interactions
window.testUIInteractions = () => {
    console.log('🖱️ Test 3: Testing UI interactions...');
    
    const createButton = document.getElementById('createPrivateGroupBtn');
    if (createButton) {
        console.log('✅ Create private group button found');
    } else {
        console.error('❌ Create private group button not found');
    }
    
    const userBtn = document.getElementById('userBtn');
    if (userBtn) {
        console.log('✅ User profile button found');
    } else {
        console.error('❌ User profile button not found');
    }
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        console.log('✅ Message input found');
    } else {
        console.error('❌ Message input not found');
    }
};

// Test 4: Test message sending
window.testMessageSending = () => {
    console.log('💬 Test 4: Testing message sending...');
    
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) {
        console.error('❌ Test 4 failed: Message input not found');
        return;
    }
    
    const sendBtn = document.getElementById('sendBtn');
    if (!sendBtn) {
        console.error('❌ Test 4 failed: Send button not found');
        return;
    }
    
    // Test sending a message
    messageInput.value = 'Test message from automated test';
    sendBtn.click();
    
    // Check if message was displayed
    setTimeout(() => {
        const messages = document.querySelectorAll('.message');
        console.log(`📨 Found ${messages.length} messages displayed`);
        
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.textContent.includes('Test message from automated test')) {
            console.log('✅ Test 4 passed: Message sent and displayed successfully');
        } else {
            console.log('⚠️ Test 4: Message may not have been displayed properly');
        }
    }, 100);
};

// Run all tests
window.runAllTests = async () => {
    console.log('🚀 Running all tests...');
    
    window.testPrivateGroupsDisplay();
    window.testUIInteractions();
    window.testMessageSending();
    
    // Wait a bit then test private group creation
    setTimeout(async () => {
        await window.testCreatePrivateGroup();
        
        // Check display again after creation
        setTimeout(() => {
            window.testPrivateGroupsDisplay();
        }, 500);
    }, 1000);
};

// Auto-run tests when loaded
console.log('📋 Available test functions:');
console.log('  - runAllTests(): Run all tests');
console.log('  - testCreatePrivateGroup(): Test creating private group');
console.log('  - testPrivateGroupsDisplay(): Check private groups display');
console.log('  - testUIInteractions(): Test UI button interactions');
console.log('  - testMessageSending(): Test message sending');
console.log('');
console.log('🎯 To run all tests, execute: runAllTests()');
