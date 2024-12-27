import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Home = 'home',
  DynamicPage = 'dynamic-page',
}

export const DATASOURCE_REF = {
  uid: 'gdev-testdata',
  type: 'testdata',
};

export const PROM_DATASOURCE_REF = {
  uid: 'prometheus',
  type: 'prometheus',
};
