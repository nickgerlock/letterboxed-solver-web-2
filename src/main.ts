import './app.css';
import App from './App.svelte';
import { createRoot } from 'svelte';

const target = document.getElementById('app');

const app = target && createRoot(App, {
  target,
});

export default app;
