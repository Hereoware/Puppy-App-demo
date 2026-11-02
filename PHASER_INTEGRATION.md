# Phaser interaction hook

The daily interaction screen reserves `#phaser-scene-mount`. The HTML prototype remains visible until Phaser takes over. `app.js` emits a `puppy:phaser-mount` event each time the daily scene is rendered:

```js
window.addEventListener("puppy:phaser-mount", ({ detail }) => {
  const { mount, trial, onFoodComplete, onActivityComplete } = detail;

  window.PuppyPhaserBridge.mount(mount.id, (parent) => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: parent.clientWidth,
      height: 300,
      scene: {
        create() {
          // Build the yard, puppy, food, bowl, rope, or disc here.
          // Use trial.t, trial.a, and trial.e to choose today's scene.
          // After the food scene reaches its 8-second completion:
          // onFoodComplete();
          // After the A scene reaches its 8-second completion:
          // onActivityComplete();
        }
      }
    });
    parent.dataset.phaserPending = "false";
    return game;
  });
});
```

Load Phaser before `app.js` and add the event listener in a script loaded before the first interaction screen. The bridge's `complete` method also accepts `("fed", durationMs)` or `("played", durationMs)` if you need to report measured interaction time directly.

Without Phaser, the current HTML fallback supports dragging food into the bowl, pulling the tug rope, and dragging the disc to the dog. It records completion and duration in the local PostgreSQL practice mode.
