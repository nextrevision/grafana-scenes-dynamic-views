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

export function getGoMetricsPage() {
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
                    $data: new SceneQueryRunner({
                        datasource: PROM_DATASOURCE_REF,
                        queries: [{
                            refId: 'gc-duration',
                            datasource: PROM_DATASOURCE_REF,
                            range: true,
                            format: 'time_series',
                            expr: `sum(rate(go_gc_duration_seconds{job="$service"}[$__rate_interval])) by (job)`,
                            instant: false,
                            legendFormat: `{{job}}`,

                        }],
                    }),
                    body: PanelBuilders.timeseries()
                        .setTitle('GC Duration')
                        .setUnit('s')
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
