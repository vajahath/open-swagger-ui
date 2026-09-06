import updateNotifier from 'update-notifier';
import pkg from '../../package.json';

// Checks for available update and returns an instance
const notifier = updateNotifier({ pkg });

// Notify using the built-in convenience method
notifier.notify();
