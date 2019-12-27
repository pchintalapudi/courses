import Vue from 'vue';
import Vuex from 'vuex';
import { classes } from './courses';
import { roads } from './road';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
    },
    mutations: {
    },
    actions: {
    },
    modules: {
        classes, roads,
    },
});
