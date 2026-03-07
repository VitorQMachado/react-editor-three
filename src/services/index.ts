import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const saveGameObjects = (gameObjects: any, saveName?: string) => {
    const headers = { 'Content-Type': 'application/json' };
    return axios.post(`${API_BASE_URL}/save-game-objects`, { gameObjects, saveName }, { headers })
    .then(function (response) {
        console.log(response);
        return response?.data;
    })
    .catch(function (error) {
        console.log(error);
    });
}

export const loadeGameObjects = (saveName?: string) => {console.log("API URL:", process.env.REACT_APP_API_BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    return axios.post(`${API_BASE_URL}/load-game-objects`, { saveName }, { headers })
    .then(function (response) {
        console.log(response);
        return response?.data;
    })
    .catch(function (error) {
        console.log(error);
    });
}

/*
export const getGameComponent = (gameComponent?: GameComponent) => {
    switch (gameComponent?.NAME as GameComponentName) {
        case 'MeshComponent':
            return GameComponentMeshComponent;

        case 'GrassComponent':
            return GameComponentMeshComponent;

        case 'LightComponent':
            return GameComponentLightComponent;

        case 'SkyboxComponent':
            return GameComponentSkyboxComponent;

        default:
            return;
    }
}
*/
