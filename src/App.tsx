import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { testIsFromPackage, GameManager } from "@vmlibs/unit_three";
import { loadeGameObjects } from './services';

function App() {
    useEffect(() => {
        console.log(testIsFromPackage());

        const gameManager = new GameManager();
        loadeGameObjects('wargame').then(data => {
            data && gameManager?.LoadGameObjectsMap(data);
        });
    }, []);

	return null;
}

export default App;
