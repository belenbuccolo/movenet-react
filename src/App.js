import React from "react";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";

import "./App.css";
import Home from "./views/Home";
import Train from "./views/Train";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <div>
          <Link to="/home">Home</Link>
        </div>
        <div>
          <Link to="/train">Train Model</Link>
        </div>
        <Switch>
          <Route path="/home" component={Home} />
          <Route path="/train" component={Train} />
        </Switch>
      </div>
    </BrowserRouter>
  );
}

export default App;
