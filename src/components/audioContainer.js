import React, { Component } from 'react';

import ColorThief from 'color-thief-standalone';

import SongList from './SongList.js';

class AudioContainer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			songs: [{
				src: ""
			}],
			currentSongURL: "",
			bgColor: "#000",
			mainColor: "#fff",
			currentSongTitle: "",
			currentSongArtist: "",
			mainSongProgress: 0,
			progBarClicked: false,
			lastProgBarDisable: 0,
			currentTime: 0,
			currentDuration: 0,
			playing: false,
			updateVisualization: true
		};

		this.onProgressBarClick = this.onProgressBarClick.bind(this)
		this.enableProgressBarScrub = this.enableProgressBarScrub.bind(this)
		this.disableProgressBarScrub = this.disableProgressBarScrub.bind(this)
		this.singleProgressBarScrub = this.singleProgressBarScrub.bind(this)
		this.updateThumbnail = this.updateThumbnail.bind(this)
		this.updateSong = this.updateSong.bind(this)
		this.toggleAudio = this.toggleAudio.bind(this)
		this.toHHMMSS = this.toHHMMSS.bind(this);
		this.nextSong = this.nextSong.bind(this);

		this.startVisualizationLoop = this.startVisualizationLoop.bind(this);
		this.stopVisualizationLoop = this.stopVisualizationLoop.bind(this);
		this.visualizationLoop = this.visualizationLoop.bind(this);
	}
	componentDidMount(){
		this.updateThumbnail(this.props);
		this.updateSong(this.props);
		this.startVisualizationLoop();
	}
	componentWillUnmount(){
		this.stopVisualizationLoop();
	}
	componentWillReceiveProps(nextProps){
		this.updateThumbnail(nextProps);
		this.updateSong(nextProps);
	}
	shouldComponentUpdate(nextProps, nextState){
		if (this.props.artifact === nextProps.artifact && this.props.paid && !nextProps.paid){
			this.refs.audio.play()
		}

		if (this.props.CurrentFile !== nextProps.CurrentFile){
			let songURL = this.props.Core.util.buildIPFSURL(this.props.Core.util.buildIPFSShortURL(nextProps.artifact, nextProps.CurrentFile));

			this.setState({currentTime: 0, currentDuration: 0, currentSongURL: songURL});
		}

		return true;
	}
	startVisualizationLoop() {
		if('webkitAudioContext' in window) {
			this.context = new window.webkitAudioContext();
		} else {
			this.context = new AudioContext();
		}
		
        this.analyser = this.context.createAnalyser();
        this.canvas = this.refs.analyzerCanvas;
        this.ctx = this.canvas.getContext('2d');
        this.audio = this.refs.audio;
        this.audio.crossOrigin = "anonymous";
        this.audioSrc = this.context.createMediaElementSource(this.audio);
        this.audioSrc.connect(this.analyser);
        this.audioSrc.connect(this.context.destination);
        this.analyser.connect(this.context.destination);

		if( !this._frameId ) {
			this._frameId = window.requestAnimationFrame( this.visualizationLoop );
		}
	}
	stopVisualizationLoop(){
		window.cancelAnimationFrame( this._frameId );
	}
	visualizationLoop(){
		if (this.refs.audio.crossOrigin !== "anonymous")
			this.refs.audio.crossOrigin = "anonymous";

		let freqData = new Uint8Array(this.analyser.frequencyBinCount)
        this.analyser.getByteFrequencyData(freqData)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.fillStyle = this.state.mainColor;
        let bars = 200;
        for (var i = 0; i < bars; i++) {
            let bar_x = i * 3;
            let bar_width = 3;
            let bar_height = -(freqData[i] / 2);
            this.ctx.fillRect(bar_x, this.canvas.height, bar_width, bar_height)
        }
        
        if (this.audio.currentTime > 0)
        	this.setState({mainSongProgress: this.audio.currentTime / this.audio.duration * 100, currentTime: this.audio.currentTime, currentDuration: this.audio.duration, playing: !this.audio.paused})

        if (this.audio.currentTime === this.audio.duration){
        	this.nextSong();
        } 
        
        this._frameId = window.requestAnimationFrame( this.visualizationLoop )
	}
	updateThumbnail(props){
		let thumbnailURL = "";

		if (props.artifact){
			thumbnailURL = props.Core.Artifact.getThumbnail(props.artifact);
		}

		if (thumbnailURL !== ""){
			if (props.Core){
				let _this = this;
				props.Core.Network.getThumbnailFromIPFS(props.Core.util.buildIPFSShortURL(props.artifact, thumbnailURL), function(srcData){
					try {
						_this.setState({songs: [{ src: srcData }]});

						let pic = new Image();
						pic.onload = function(){
							try {
								let colorThief = new ColorThief();
								let palette = colorThief.getPalette(_this.refs.image, 2);
								_this.setState({bgColor: "rgb(" + palette[0].join(',') + ")"})
								_this.setState({mainColor: "rgb(" + palette[1].join(',') + ")"})
								pic = undefined;
							} catch (e) { }
						}
						pic.src = srcData;
					} catch(e) { }
				})
			}
		} else {
			this.setState({bgColor: "#000"})
			this.setState({mainColor: "#fff"})
			this.setState({songs: [{ src: "" }]});
		}
	}
	updateSong(props){
		let songs = props.Core.Artifact.getSongs(props.artifact);

		let firstSong;
		for (let i = 0; i < songs.length; i++){
			if (!firstSong){
				firstSong = songs[i];
				let ipfsURL = props.Core.util.buildIPFSURL(songs[i].location, songs[i].fname);
				let title = props.Core.Artifact.getTitle(props.artifact);
				let artist = props.Core.Artifact.getArtist(props.artifact);
				this.setState({currentSongURL: ipfsURL, currentSongTitle: title, currentSongArtist: artist});
			}
		}
	}
	toggleAudio(event){
		if (this.state.playing){
			this.refs.audio.pause();
		} else {
			this.refs.audio.play();
		}
	}
	enableProgressBarScrub(event){
		this.setState({progBarClicked: true})
		this.onProgressBarClick(event);
	}
	singleProgressBarScrub(event){
		this.setState({progBarClicked: true})
		this.onProgressBarClick(event);
		this.setState({progBarClicked: false, lastProgBarDisable: 0})
	}
	disableProgressBarScrub(){
		if (this.state.progBarClicked)
			this.setState({progBarClicked: false, lastProgBarDisable: Date.now()})	
	}
	onProgressBarClick(event){
		if (this.state.progBarClicked || Date.now() - this.state.lastProgBarDisable <= 500){
			let xClickLocation = event.clientX;
			let playButtonWidth = 40;
			let volumeButtonWidth = 40;
			let screenWidth = window.innerWidth;

			let overallWidth = screenWidth - playButtonWidth - volumeButtonWidth;

			let onePercent = overallWidth / 100;

			let offsetClickX = xClickLocation - playButtonWidth;

			let percentClick = offsetClickX / onePercent;

			if (percentClick < 0)
				percentClick = 0;
			else if (percentClick > 100)
				percentClick = 100;

			let onePercentOfSong = this.refs.audio.duration / 100;

			let songSecondAtPercent = onePercentOfSong * percentClick;

			if (this.refs.audio && !isNaN(songSecondAtPercent)){
				this.refs.audio.currentTime = songSecondAtPercent;
			}
		}	
	}
	toHHMMSS(numToSecond) {
	    var sec_num = parseInt(numToSecond, 10); // don't forget the second param
	    var hours   = Math.floor(sec_num / 3600);
	    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	    var seconds = sec_num - (hours * 3600) - (minutes * 60);

	    if (hours   < 10) {hours   = "0"+hours;}
	    if (minutes < 10 && hours > 0) {minutes = "0"+minutes;}
	    if (seconds < 10) {seconds = "0"+seconds;}

	    if (hours > 0){
	    	return hours+':'+minutes+':'+seconds;
	    } else {
	    	return minutes+':'+seconds;
	    }
	}
	nextSong(){
		let songs = this.props.SongList;
		let setNextSong = false;
		let haveSetNextSong = false;

		for (var i = 0; i < songs.length; i++) {
			if (setNextSong && !haveSetNextSong){
				this.props.setCurrentFile(songs[i])
				haveSetNextSong = true;
			}
			if (songs[i].fname === this.props.CurrentFile.fname){
				setNextSong = true;
			}
		}
	}
	render() {
		return (
			<div className="" style={{paddingTop: "20px", backgroundColor: this.state.bgColor, height: "100%", position: "relative", overflow: "hidden"}}>
                <audio
                    ref="audio"
                    autoPlay={this.props.DisplayPaywall ? false : true}
                    controls={true}
                    //this is the link to my song url feel free to use it or replace it with your own
                    src={this.state.currentSongURL}
                    style={{display: "none"}}
                    >
                </audio>
                <div className="container" style={{height: "90%"}}>
	                <div className="row" style={{height: "90%"}}>
		                <div className={this.props.SongList.length > 1 ? "col-6" : "col-12"} style={{margin: "auto"}}>
		                	<h3 className="text-center" style={{color: this.state.mainColor}}>
		                		{this.props.CurrentFile.dname ? this.props.CurrentFile.dname : this.props.CurrentFile.fname} - {this.state.currentSongArtist}
		                	</h3>
							<img ref="image" src={this.state.songs[0].src} style={{width: "100%", height: "auto", maxWidth: "350px", maxHeight: "350px", margin: "0px auto", marginTop: "25px", display: "block"}} alt="" />
						</div>
						{this.props.SongList.length > 1 ? <div className="col-6" style={{margin: "auto"}}>
							<style dangerouslySetInnerHTML={{
								__html: [
									'.scrollbar::-webkit-scrollbar {',
									'    background-color: ' + this.state.mainColor + ';',
									'}',
									'.scrollbar::-webkit-scrollbar-thumb {',
									'    background-color: ' + this.state.mainColor + ';',
									'}',
									'.scrollbar::-webkit-scrollbar-track {',
									'    background-color: ' + this.state.bgColor + ';',
									'}'
								].join('\n')
							}} />
							<div className="scrollbar" style={{height: "400px", overflowY: "scroll", margin: "auto", maxWidth: "450px"}}>
								<h3 style={{color: this.state.mainColor, textAlign: "center"}}>
								</h3>
								<SongList 
									SongList={this.props.SongList} 
									artifact={this.props.artifact} 
									Core={this.props.Core} 
									CurrentFile={this.props.CurrentFile}
									setCurrentFile={this.props.setCurrentFile}
									mainColor={this.state.mainColor}
									bgColor={this.state.bgColor}
								/>
							</div>
						</div> : ""}
					</div>
				</div>
				<div style={{width:"102%", height: "200px", position: "absolute", bottom: "10px", marginLeft: "-10px"}}>
					<canvas
		            	className="canvas-goo"
		                ref="analyzerCanvas"
		                id="analyzer"
		                style={{width:"100%", height: "200px"}}
		                >
	                </canvas>
                </div>
                <div style={{width:"100%", height: "40px", position: "absolute", bottom: "0px", borderTop: "1px solid " + this.state.mainColor, display: "flex", backgroundColor: this.state.bgColor}}>
                	<div style={{width: "40px", height: "100%", borderRight: "1px solid " + this.state.mainColor, display: "flex"}} onClick={this.toggleAudio}><span onClick={this.toggleAudio} className={this.state.playing ? "icon icon-controller-paus" : "icon icon-controller-play"} style={{fontSize: "25px", color: this.state.mainColor, margin:"auto auto"}}></span></div>
                	<div style={{width: "100%"}} onClick={this.singleProgressBarScrub} onMouseDown={this.enableProgressBarScrub} onMouseMove={this.onProgressBarClick} onMouseUp={this.disableProgressBarScrub} onMouseOut={this.disableProgressBarScrub}>
                		<div style={{height: "100%", width: this.state.mainSongProgress + "%", backgroundColor: this.state.mainColor, border: "1px solid " + this.state.bgColor}} onClick={this.singleProgressBarScrub} onMouseDown={this.enableProgressBarScrub} onMouseMove={this.onProgressBarClick} onMouseUp={this.disableProgressBarScrub} onMouseOut={this.disableProgressBarScrub}>
                			<span style={{mixBlendMode: "difference", color: "#fff", verticalAlign: "middle", lineHeight: "35px", marginLeft: "10px"}}>{this.toHHMMSS(this.state.currentTime)}/{this.toHHMMSS(this.state.currentDuration)}</span>
                		</div>
                	</div>
                	<div style={{width: "40px", height: "100%", borderLeft: "1px solid " + this.state.mainColor, display: "flex"}}><span className="icon icon-sound" style={{fontSize: "25px", color: this.state.mainColor, margin:"auto auto"}}></span></div>
                </div>
			</div>
		);
	}
}

export default AudioContainer;