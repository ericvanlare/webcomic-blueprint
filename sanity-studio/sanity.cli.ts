import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: 'YOUR_PROJECT_ID', // TODO: Replace with your Sanity project ID
    dataset: 'production',
  },
});
