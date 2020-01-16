import updateNotifier from 'update-notifier';

const pkg = require('../../package.json');

// Checks for available update and returns an instance
const notifier = updateNotifier({ pkg });

// Notify using the built-in convenience method
notifier.notify();
