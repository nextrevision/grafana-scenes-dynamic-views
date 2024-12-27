import React, {useMemo} from 'react';
import {
  behaviors,
  CustomVariable,
  QueryVariable,
  SceneApp,
  SceneAppPage, SceneDataLayerControls,
  SceneVariableSet, VariableValueSelectors
} from '@grafana/scenes';
import {PROM_DATASOURCE_REF, ROUTES} from '../../constants';
import {prefixRoute} from '../../utils/utils.routing';
import {getBasicScene} from '../Home/scenes';
import {VariableHide} from "@grafana/data";
import {getDynamicPanelPage} from "./dynamicPanelPage";
import {getGoMetricsPage} from "./goMetricsPage";

const getFirstTabScene = () => {
    return getBasicScene(false, '__server_names');
};

const addTab = (parentPage: SceneAppPage, newPage: SceneAppPage, index: number) => {
  const key = newPage.state.key
  const tabExists = parentPage.state.tabs?.some(tab => tab.state.key === key)
  if (!tabExists) {
    let tabs = parentPage.state.tabs || []
    tabs.splice(index, 0, newPage)
    parentPage.setState({tabs: tabs})
  }
}

const removeTab = (parentPage: SceneAppPage, oldPage: SceneAppPage) => {
  const key = oldPage.state.key
  const tabExists = parentPage.state.tabs?.some(tab => tab.state.key === key)
  if (tabExists) {
    const tabs = parentPage.state.tabs?.filter(tab => tab.state.key !== key)
    parentPage.setState({tabs: tabs})
    // If page is active, redirect to a safe place...
  }
}

const getScene = () => {
    const serviceVariable = new CustomVariable({
        name: 'service',
        label: 'Service',
        query: 'dummy, prometheus',
        includeAll: false,
        defaultToAll: false,
        isMulti: false,
        isReadOnly: false,
    })

    const goQueryVariable = new QueryVariable({
        name: 'goServices',
        datasource: PROM_DATASOURCE_REF,
        query: {
            query: 'query_result(sum(go_info{job="$service"}) by (job))',
            refId: 'go-services',
        },
        regex: '/job="(?<value>.*)".*/',
        skipUrlSync: true,
        hide: VariableHide.hideVariable,
        includeAll: false,
        defaultToAll: false,
        isMulti: false,
        isReadOnly: true,
    })

    let sceneAppPage = new SceneAppPage({
        title: 'Dynamic Page',
        subTitle: 'This scene showcases dynamic tabs and panels.',
        // Important: Mind the page route is ambiguous for the tabs to work properly
        url: prefixRoute(`${ROUTES.DynamicPage}`),
        $variables: new SceneVariableSet({
            variables: [
                serviceVariable,
                goQueryVariable
            ]
        }),
        controls: [
            new VariableValueSelectors({}),
            new SceneDataLayerControls(),
        ],
        hideFromBreadcrumbs: true,
        getScene: getFirstTabScene,
        tabs: [
            new SceneAppPage({
                title: 'First Tab',
                key: 'first-tab',
                url: prefixRoute(`${ROUTES.DynamicPage}`),
                getScene: getFirstTabScene,
            }),
            new SceneAppPage({
                title: 'Dynamic Panel',
                key: 'dynamic-panel',
                url: prefixRoute(`${ROUTES.DynamicPage}/dynamic-panel`),
                getScene: getDynamicPanelPage,
            }),
        ],
    });

  const goPage = new SceneAppPage({
    title: 'Go Metrics',
    key: 'go',
    url: prefixRoute(`${ROUTES.DynamicPage}/go`),
    getScene: () => getGoMetricsPage()
  })

  const conditionalGoTab = new behaviors.ActWhenVariableChanged({
    variableName: 'goServices',
    onChange: (variable, behavior) => {
      if (variable.getValue() !== undefined && variable.getValue() === serviceVariable.getValueText()) {
        addTab(sceneAppPage, goPage, 2)
      } else {
        removeTab(sceneAppPage, goPage)
      }
    }
  })

  sceneAppPage.setState({
    $behaviors: [
        conditionalGoTab
    ]
  })

  return new SceneApp({
        pages: [sceneAppPage],
    });
}

const DynamicPage = () => {
    const scene = useMemo(() => getScene(), []);

    return <scene.Component model={scene}/>;
};

export default DynamicPage;
