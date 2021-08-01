import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import "./App.css";
import Home from "./views/Home";
import Train from "./views/Train";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Switch>
          <Route path="/home" component={Home} />
          <Route path="/train" component={Train} />
        </Switch>
      </div>
    </BrowserRouter>
  );
}

export default App;
