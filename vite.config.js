// vite.config.js
export default {
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/shaders/AnaglyphShader.js',
      'three/examples/jsm/postprocessing/RenderPass.js',
      'three/examples/jsm/postprocessing/ShaderPass.js',
      // etc…
    ]
  }
}