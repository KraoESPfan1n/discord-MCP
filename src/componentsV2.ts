export const COMPONENTS_V2_LIMITS = {
  MAX_COMPONENTS_PER_MESSAGE: 40,
  MAX_TEXT_DISPLAY_CHARS: 4000,
  MAX_MEDIA_GALLERY_ITEMS: 10,
};

export interface ComponentsV2Stats {
  componentCount: number;
  textDisplayChars: number;
  mediaGalleryItems: number;
}

export function validateComponentsV2(stats: ComponentsV2Stats) {
  if (stats.componentCount > COMPONENTS_V2_LIMITS.MAX_COMPONENTS_PER_MESSAGE) {
    throw new Error('Too many components');
  }
  if (stats.textDisplayChars > COMPONENTS_V2_LIMITS.MAX_TEXT_DISPLAY_CHARS) {
    throw new Error('Too many TextDisplay characters');
  }
  if (stats.mediaGalleryItems > COMPONENTS_V2_LIMITS.MAX_MEDIA_GALLERY_ITEMS) {
    throw new Error('Too many MediaGallery items');
  }
}
