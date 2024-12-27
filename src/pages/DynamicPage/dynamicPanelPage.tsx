import {
    EmbeddedScene,
    PanelBuilders,
    SceneControlsSpacer,
    SceneFlexItem,
    SceneFlexLayout,
    SceneQueryRunner,
    SceneRefreshPicker,
    SceneTimePicker,
    SceneTimeRange,
} from '@grafana/scenes';
import {PROM_DATASOURCE_REF} from '../../constants';
import {HiddenWhenNoDataBehavior} from "../../utils/utils.behaviors";

export function getDynamicPanelPage() {
    const timeRange = new SceneTimeRange({
        from: 'now-6h',
        to: 'now',
    });

    return new EmbeddedScene({
        $timeRange: timeRange,
        body: new SceneFlexLayout({
            children: [
                new SceneFlexItem({
                    minHeight: 100,
                    isHidden: true,
                    $behaviors: [
                        new HiddenWhenNoDataBehavior()
                    ],
                    $data: new SceneQueryRunner({
                        datasource: PROM_DATASOURCE_REF,
                        queries: [{
                            refId: 'up',
                            datasource: PROM_DATASOURCE_REF,
                            range: true,
                            format: 'time_series',
                            expr: `sum(up{job="$service"}) by (job)`,
                            instant: false,
                            legendFormat: `{{job}}`,

                        }],
                    }),
                    body: PanelBuilders.timeseries()
                        .setTitle('Up for prometheus only')
                        .setUnit('short')
                        .build(),
                }),
            ],
        }),
        controls: [
            new SceneControlsSpacer(),
            new SceneTimePicker({isOnCanvas: true}),
            new SceneRefreshPicker({
                intervals: ['5s', '1m', '1h'],
                isOnCanvas: true,
            }),
        ],
    });
}
