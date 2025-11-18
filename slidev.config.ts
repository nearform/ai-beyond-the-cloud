import { defineSlidevConfig } from '@slidev/cli'

export default defineSlidevConfig({
  // Public directory is at project root, Slidev will find it automatically
  // Images in public/ are accessible via /filename.png
  css: {
    code: `
      .image-contain img {
        max-width: 100% !important;
        max-height: 100% !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
      }
      .image-contain .slidev-image {
        max-width: 100% !important;
        max-height: 100% !important;
        width: auto !important;
        height: auto !important;
        object-fit: contain !important;
      }
    `,
  },
})

