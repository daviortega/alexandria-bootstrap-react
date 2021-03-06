import React, { Component } from 'react';

import {
  Link
} from 'react-router-dom'

class LoginPage extends Component {
	render() {
		return (
			<div className="container">
				<div className="row justify-content-center">
					<div className="col-12 col-sm-12 col-md-8 col-lg-7 col-xl-6">
						<div style={{height: "75px"}}></div>
						<fieldset>
							<h2>Please Login</h2>
							<hr className="colorgraph" />
							<div className="form-group">
								<input type="text" name="email" id="email" className="form-control input-lg" placeholder="Email/Identifier" />
								<div className="invalid-feedback" id="feedback_email">
									Email/Identifier is invalid. Please provide your identifier or your account Email.
								</div>
							</div>
							<div className="form-group">
								<input type="password" name="password" id="password" className="form-control input-lg" placeholder="Password" />
								<div className="invalid-feedback" id="feedback_password">
									Invalid Password.
								</div>
							</div>
							<span className="button-checkbox">
								<button type="button" className="btn btn-primary active" data-color="primary"><i className="fa fa-check-square-o"></i> Remember Me</button>
								<input type="checkbox" name="remember-me" id="remember-me" checked="checked" className="d-none" />
							</span>
							<hr className="colorgraph" />
							<div className="row">
								<div className="col-xs-3 col-sm-3 col-md-3 order-2 order-sm-1">
									<Link to="/register"><button className="btn btn-lg btn-outline-secondary btn-block">Register</button></Link>
								</div>
								<div className="col-xs-9 col-sm-9 col-md-9 order-1 order-sm-2">
									<button id="signin" className="btn btn-lg btn-success btn-block" onclick="tryLogin()">Login</button>
								</div>
							</div>
						</fieldset>
					</div>
				</div>
			</div>
		);
	}
}

export default LoginPage;