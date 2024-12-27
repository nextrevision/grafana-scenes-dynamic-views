import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
const HomePage = React.lazy(() => import('../../pages/Home/Home'));
const DynamicPage = React.lazy(() => import('../../pages/DynamicPage/scenes'));

export const Routes = () => {
  return (
    <Switch>
      <Route path={prefixRoute(`${ROUTES.DynamicPage}`)} component={DynamicPage} />
      <Route path={prefixRoute(`${ROUTES.Home}`)} component={HomePage} />
      <Redirect to={prefixRoute(ROUTES.Home)} />
    </Switch>
  );
};
