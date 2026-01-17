import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: '7m2zspp8',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false, // Set to true for production
});

const imageBuilder = imageUrlBuilder(client);

export const urlFor = (source: any) => imageBuilder.image(source);
