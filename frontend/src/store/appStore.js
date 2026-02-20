import {defineStore} from 'pinia'


export const useAppStore =  defineStore('app', ()=>{

    /*  
    The composition API way of defining a Pinia store
    ref() s become state properties
    computed() s become getters
    function() s become actions  
    */ 

    // ACTIONS
    const apiGet = async (path) => {
        try {
            const response = await fetch(path, { method: 'GET' });
            if (!response.ok) return [];
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.log(`API GET error: ${error}`);
            return [];
        }
    };

    const getAllInRange = async (start, end) => {
        return apiGet(`/api/climo/get/${start}/${end}`);
    };

    const getTemperatureMMAR = async (start, end) => {
        return apiGet(`/api/mmar/temperature/${start}/${end}`);
    };

    const getHumidityMMAR = async (start, end) => {
        return apiGet(`/api/mmar/humidity/${start}/${end}`);
    };

    const getFreqDistro = async (variable, start, end) => {
        return apiGet(`/api/frequency/${variable}/${start}/${end}`);
    };

    return { 
    // EXPORTS	
        getAllInRange,
        getTemperatureMMAR,
        getHumidityMMAR,
        getFreqDistro,
       }
},{ persist: true  });
