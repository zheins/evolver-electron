// @flow
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import routes from '../constants/routes.json';
import { withStyles } from '@material-ui/core/styles';
import {FaArrowLeft} from 'react-icons/fa';
import ScriptFinder from './python-shell/ScriptFinder'
import Card from '@material-ui/core/Card';
const { ipcRenderer } = require('electron');
import ModalClone from './python-shell/ModalClone';

const remote = require('electron').remote;
const app = remote.app;

var fs = require('fs');
var path = require('path');

const filesToCopy = ['custom_script.py', 'eVOLVER.py', 'nbstreamreader.py', 'pump_cal.txt', 'eVOLVER_parameters.json'];

const styles = {
  cardRoot: {
    width: 1000,
    height: 1000,
    position: 'absolute',
    backgroundColor: 'black',
    verticalAlign: 'bottom',
    horizontalAlign: 'left',
    padding: '5px 0px 15px 15px'
  },
  cardScript:{
    top: '60px',
    left: '75px',
    overflowY: 'auto'
  },
  cardPyshell: {
    top: '200px',
    left: '30px',
  }
};

function startScript(exptDir) {
    ipcRenderer.send('start-script', exptDir);
};

class ExptManager extends React.Component {
  constructor(props) {
    super(props);  
    this.state = {
      scriptDir: 'experiments',
      activeScript: '',
      runningExpts: [],
      pausedExpts: [],
      alertOpen: false,
      alertDirections: 'Enter new experiment name',
      exptToClone: '',
      refind: false,
      evolverIp: this.props.evolverIp
    };

    ipcRenderer.on('to-renderer', (event, arg) => {
    });

    ipcRenderer.on('running-expts', (event, arg) => {
        this.setState({runningExpts: arg});
    });

    ipcRenderer.on('paused-expts', (event, arg) => {
        this.setState({pausedExpts: arg});
    });

    ipcRenderer.send('paused-expts');
    ipcRenderer.send('running-expts');

    ipcRenderer.on('get-ip', (event, arg) => {
      this.setState({evolverIp: arg});
      });

  }

  handleSelectFolder = (activeFolder) => {
    var exptDir = path.join(app.getPath('userData'), this.state.scriptDir, activeFolder);
    var activeScript = activeFolder + '/' + 'custom_script.py';
    if (this.state.exptDir !== exptDir){
      this.setState({exptDir: exptDir, activeScript: activeScript});
    }
  }

  handleStart = (script) => {
    startScript(path.join(app.getPath('userData'), this.state.scriptDir, script));
    setTimeout(function () {
        ipcRenderer.send('paused-expts');
        ipcRenderer.send('running-expts');
    }, 1000);
  }

  handleStop = (script) => {
    ipcRenderer.send('stop-script', path.join(app.getPath('userData'), this.state.scriptDir, script));
    setTimeout(function () {
        ipcRenderer.send('paused-expts');
        ipcRenderer.send('running-expts');
    }, 1000);
  }

  handlePause = (script) => {
    ipcRenderer.send('pause-script', path.join(app.getPath('userData'), this.state.scriptDir, script));
    setTimeout(function () {
        ipcRenderer.send('paused-expts');
        ipcRenderer.send('running-expts');
    }, 1000);
  }

  handleContinue = (script) => {
     ipcRenderer.send('continue-script', path.join(app.getPath('userData'), this.state.scriptDir, script));
     setTimeout(function() {
        ipcRenderer.send('paused-expts');
        ipcRenderer.send('running-expts');
     });
  };

    handleEdit = (script) => {
    };

    handleGraph = (script) => {
    };

    handleClone = (script) => {
        this.setState({alertOpen: true, exptToClone: script});
    };

    onResumeClone = (exptName) => {
        this.setState({alertOpen: false});
        this.createNewExperiment(exptName, this.state.exptToClone);

    };

    createNewExperiment = (exptName, exptToClone) => {
        var newDir = path.join(app.getPath('userData'), this.state.scriptDir, exptName);
        var oldDir = path.join(app.getPath('userData'), this.state.scriptDir, exptToClone);
        if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir);
        }
        filesToCopy.forEach(function (filename) {
          if (fs.existsSync(path.join(oldDir, filename))) {
            fs.copyFileSync(path.join(oldDir, filename), path.join(newDir, filename));
          }
        });      
        this.setState({refind: !this.state.refind});
    }

  render() {
    const { classes } = this.props;

    return (
      <div>
        <h2 className="managerTitle"> eVOLVER Scripts </h2>
        <Card classes={{root:classes.cardRoot}} className={classes.cardScript}>
          <ScriptFinder subFolder={this.state.scriptDir}
            isScript= {true}
            onSelectFolder={this.handleSelectFolder}
            onClone={this.handleClone}
            onEdit={this.handleEdit}
            onGraph={this.handleGraph}
            onStart={this.handleStart}
            onStop={this.handleStop}
            onPause={this.handlePause}
            onContinue={this.handleContinue}
            runningExpts={this.state.runningExpts}
            pausedExpts={this.state.pausedExpts}
            refind={this.state.refind}
            evolverIp = {this.state.evolverIp}/>
        </Card>

        <Link className="expManagerHomeBtn" id="experiments" to={routes.HOME}><FaArrowLeft/></Link>
        <ModalClone
          alertOpen= {this.state.alertOpen}
          alertQuestion = {this.state.alertDirections}
          onAlertAnswer = {this.onResumeClone}/>
      </div>
    );
  }
}

export default withStyles(styles)(ExptManager);
