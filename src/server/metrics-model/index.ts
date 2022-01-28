/**
 * 
 * state we need
 * metrics:Metric[]
 * dimensions:Dimension[]
 * 
 */

// FIXME: this should be part of the api spec, not here locally!
import yaml from 'js-yaml';

 import type { DataModelerState } from "../../types";
 import { getByID } from "../dataset/index.js";
 import type { MetricsModel, MetricsModelView, TimeSeries, Leaderboard, MetricConfiguration, DimensionConfiguration } from "../../types"
 import { rollupQuery } from '../explore-api.js';
 import { guidGenerator } from "../../util/guid.js";
 
 export function addError(dispatch:Function, id:string, message:string) : void {
    dispatch((draft:DataModelerState) => {
        let q = getByID(draft.metricsModels, id) as MetricsModel;
        q.error = message;
    });
}
 
 export function createMetricsModelActions(api) {
     return {


         createMetricsModel() {
             return ((draft:DataModelerState) => {
                 draft.metricsModels.push({
                     id: guidGenerator(),
                     name: 'new_model',
                     spec: ''
                 })
             })
         },
         
         deleteMetricsModel({ id } : { id: string }) {
             return ((draft:DataModelerState) => {
                
                draft.metricsModels = draft.metricsModels.filter(model => model.id !== id);
                // if (draft.activeMetricsModel === id && draft.metricsModels.length) {
                //     draft.activeMetricsModel = draft.metricsModels[0].id;
                // }
             })
         },
 
         updateMetricsModelSpec({id, newSpec} : { id:string, newSpec: string}) {

            return async (dispatch, getState) => {
                const model = getByID(getState().metricsModels, id) as MetricsModel;
                let parsedSpec;
                let errorReached = false;
                try {
                    parsedSpec = yaml.load(newSpec);
                } catch (err) {
                    errorReached = true;
                    console.error(err)
                    addError(dispatch, id, err.message);
                    return;
                }
                
                dispatch((draft:DataModelerState) => {
                    const model = getByID(draft.metricsModels, id) as MetricsModel;
                    model.spec = newSpec;
                    model.parsedSpec = parsedSpec;   
                    // if the model errored, it wouldn't get to this point.
                    if (model.error) delete model.error;
                });
            }
         },
 
         updateMetricsModelName({id, name} : { id:string, name: string}) {
             return ((draft:DataModelerState) => {
                 const metricsModel = getByID(draft.metricsModels, id) as MetricsModel;
                 metricsModel.name = name;
             })
         },

         /** this should not be a permanent action */
        TEMP_generateMetricsModelPreview({id} : { id:string }) {
             return async (dispatch, getState) => {
                // let's first get the model and do the work.
                //
                //get the metrics and then for each generate a preview.
             }
         }
     }
 }