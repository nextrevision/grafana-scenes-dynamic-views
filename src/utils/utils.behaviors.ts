import {
    SceneFlexItem,
    SceneFlexLayout,
    SceneObject,
    SceneObjectBase,
    SceneObjectState,
    sceneGraph,
    SceneDataState, SceneTimeRangeState,
} from '@grafana/scenes';
import {rangeUtil} from "@grafana/data";

export interface ShowBasedOnConditionBehaviorState extends SceneObjectState {
    references: string[];
    condition: (...args: any[]) => boolean;
}

export interface ShowBasedCondition {
    references: SceneObject[];
    condition: () => boolean;
}

/**
 * Just a proof of concept example of a behavior
 */
export class HiddenLayoutItemBehavior<
    TState extends SceneObjectState = SceneObjectState
> extends SceneObjectBase<TState> {
    public constructor(state: TState) {
        super(state);
    }

    protected setHidden() {
        const parentLayoutItem = getClosestLayoutItem(this);

        if (!parentLayoutItem.state.isHidden) {
            parentLayoutItem.setState({isHidden: true});
        }
    }

    protected setVisible() {
        const parentLayoutItem = getClosestLayoutItem(this);

        if (parentLayoutItem.state.isHidden) {
            parentLayoutItem.setState({isHidden: false});
        }
    }
}

function getClosestLayoutItem(obj: SceneObject): SceneFlexItem | SceneFlexLayout {
    if (obj instanceof SceneFlexItem || obj instanceof SceneFlexLayout) {
        return obj;
    }

    if (!obj.parent) {
        throw new Error('Could not find parent flex item');
    }

    return getClosestLayoutItem(obj.parent);
}

export class ShowBasedOnConditionBehavior extends HiddenLayoutItemBehavior<ShowBasedOnConditionBehaviorState> {
    private _resolvedRefs: SceneObject[] = [];

    public constructor(state: ShowBasedOnConditionBehaviorState) {
        super(state);

        this.addActivationHandler(() => this._onActivate());
    }

    private _onActivate() {
        // Subscribe to references
        for (const objectKey of this.state.references) {
            const solvedRef = sceneGraph.findObject(this, (obj) => obj.state.key === objectKey);
            if (!solvedRef) {
                throw new Error(`SceneObject with key ${objectKey} not found in scene graph`);
            }

            this._resolvedRefs.push(solvedRef);
            this._subs.add(solvedRef.subscribeToState(() => this._onReferenceChanged()));
        }

        this._onReferenceChanged();
    }

    private _onReferenceChanged() {
        if (this.state.condition(...this._resolvedRefs)) {
            this.setVisible();
        } else {
            this.setHidden();
        }
    }
}

export class HiddenWhenNoDataBehavior extends HiddenLayoutItemBehavior {
    public constructor() {
        super({});

        this.addActivationHandler(() => {
            this._subs.add(sceneGraph.getData(this).subscribeToState(this._onData));
        });
    }

    private _onData = (data: SceneDataState) => {
        if (!data.data) {
            return;
        }

        if (data.data && data.data.series.length === 0) {
            this.setHidden();
            return;
        }

        if (data.data.series[0].length === 0) {
            this.setHidden();
            return;
        }

        this.setVisible();
    };
}

export interface HiddenForTimeRangeBehaviorState extends SceneObjectState {
    greaterThan: string;
}

/**
 * Just a proof of concept example of a behavior
 */
export class HiddenForTimeRangeBehavior extends HiddenLayoutItemBehavior<HiddenForTimeRangeBehaviorState> {
    public constructor(state: HiddenForTimeRangeBehaviorState) {
        super(state);

        this.addActivationHandler(() => {
            this._subs.add(sceneGraph.getTimeRange(this).subscribeToState(this._onTimeRangeChange));
            this._onTimeRangeChange(sceneGraph.getTimeRange(this).state);
        });
    }

    private _onTimeRangeChange = (state: SceneTimeRangeState) => {
        const range = rangeUtil.convertRawToRange({ from: this.state.greaterThan, to: 'now' });

        if (state.value.from.valueOf() < range.from.valueOf()) {
            this.setHidden();
        } else {
            this.setVisible();
        }
    };
}
