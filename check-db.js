import { verifyFirebaseConnection } from './src/lib/firebase.js';

verifyFirebaseConnection().then(console.log).catch(console.error);
