// Jest can't parse raw CSS (used for web-only global styles via
// `import '@/global.css'`) — map it to an empty module in tests.
module.exports = {};
