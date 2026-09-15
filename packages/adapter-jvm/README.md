# adapter-jvm (stub — doc-only, do not build yet)

Legacy JVM/Swing/Android adapter. Port reference (read-only sources, always non-modifying):

- `voxel-can-y-70f9d/java/painter/src/voxel/painter/ui/PainterModel.java` — typed listener bus;
  the shape of this framework's `BlockContext.subscribe`/reactive state.
- `voxel-can-y-70f9d/java/painter/src/voxel/painter/ui/{ToolDockPanel,OrbitPreviewPanel,OrthoSlicePanel,ModeExtrasPanel}.java` —
  self-contained `JPanel implements PainterModel.Listener` components + `syncing` guard.
- `secure-mesh-navigation@origin/scout/android-distribution-preview/navigation/android/frontend-ui/.../Map3dView.java`,
  `AudioVisualizerView.java`, `FrontendMenuPanel.kt` — pure-canvas map/waveform primitives and the
  reusable menu-panel block.
- `routi-can-y-667e5/navigation/android/app/src/main/java/dev/warp/stream/MainActivity.java` +
  `car/*.java` — Android/Android-Auto surface variants consuming the same backend contract.

Target: port the data/model layer (document-like state) and canvas primitives behind the
`@imagoro/core` `Block` interface; never the widget toolkits themselves. See docs/block-spec.md §7
for parity acceptance.