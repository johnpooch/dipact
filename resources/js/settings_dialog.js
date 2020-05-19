import * as helpers from '%{ cb "/js/helpers.js" }%';

import Color from '%{ cb "/js/color.js" }%';

export default class SettingsDialog extends React.Component {
	constructor(props) {
		super(props);
		this.allNations = Object.keys(
			Globals.variants.reduce((sum, el) => {
				el.Properties.Nations.forEach(nation => {
					sum[nation] = true;
				});
				return sum;
			}, {})
		).sort();
		this.state = {
			open: false,
			userConfig: Globals.userConfig,
			newColorOverrideType: "position",
			newColorOverrideColor: "#ffffff",
			newColorOverrideNation: this.allNations[0],
			newColorOverrideVariant: "Classical",
			newColorOverridePosition: 0
		};
		if (this.props.parentCB) {
			this.props.parentCB(this);
		}
		this.close = this.close.bind(this);
		this.updatePhaseDeadline = this.updatePhaseDeadline.bind(this);
		this.newColorSetter = this.newColorSetter.bind(this);
		this.newColorDeleter = this.newColorDeleter.bind(this);
		this.addColorOverride = this.addColorOverride.bind(this);
		this.saveConfig = this.saveConfig.bind(this);
	}
	addColorOverride() {
		if (this.state.newColorOverrideType == "position") {
			Globals.colorOverrides.positions[
				this.state.newColorOverridePosition
			] = this.state.newColorOverrideColor;
		} else if (this.state.newColorOverrideType == "nation") {
			Globals.colorOverrides.nations[
				this.state.newColorOverrideNation
			] = this.state.newColorOverrideColor;
		} else {
			const variant = this.state.newColorOverrideVariant;
			if (!Globals.colorOverrides.variants[variant]) {
				Globals.colorOverrides.variants[variant] = {};
			}
			Globals.colorOverrides.variants[variant][
				this.state.newColorOverrideNation
			] = this.state.newColorOverrideColor;
		}
		this.setState((state, props) => {
			state = Object.assign({}, state);
			state.userConfig.Properties.Colors =
				Globals.colorOverrides.positions;
			Object.keys(Globals.colorOverrides.nations || {}).forEach(
				nation => {
					state.userConfig.Properties.Colors.push(
						nation.replace(helpers.overrideReg, "") +
							"/" +
							Globals.colorOverrides.nations[nation]
					);
				}
			);
			Object.keys(Globals.colorOverrides.variants || {}).forEach(
				variant => {
					Object.keys(
						Globals.colorOverrides.variants[variant] || {}
					).forEach(nation => {
						state.userConfig.Properties.Colors.push(
							variant.replace(helpers.overrideReg, "") +
								"/" +
								nation.replace(helpers.overrideReg, "") +
								"/" +
								Globals.colorOverrides.variants[variant][nation]
						);
					});
				}
			);
			return state;
		}, this.saveConfig);
	}
	newColorSetter(idx, prefix) {
		return col => {
			this.setState((state, props) => {
				state = Object.assign({}, state);
				state.userConfig.Properties.Colors[idx] = prefix + col;
				return state;
			}, this.saveConfig);
		};
	}
	newColorDeleter(idxToDelete) {
		return _ => {
			this.setState((state, props) => {
				state = Object.assign({}, state);
				state.userConfig.Properties.Colors = state.userConfig.Properties.Colors.filter(
					(c, idx) => {
						return idx != idxToDelete;
					}
				);
				return state;
			}, this.saveConfig);
		};
	}
	close() {
		helpers.unback(this.close);
		this.setState({ open: false });
	}
	componentDidUpdate(prevProps, prevState, snapshot) {
		if (
			JSON.stringify(Globals.userConfig) !=
			JSON.stringify(this.state.userConfig)
		) {
			this.setState({ userConfig: Globals.userConfig });
		}
		if (!prevState.open && this.state.open) {
			gtag("set", {
				page_title: "SettingsDialog",
				page_location: location.href
			});
			gtag("event", "page_view");
		}
	}
	saveConfig() {
		this.state.userConfig.Properties.PhaseDeadlineWarningMinutesAhead = Number.parseInt(
			this.state.userConfig.Properties.PhaseDeadlineWarningMinutesAhead ||
				"0"
		);
		let updateLink = this.state.userConfig.Links.find(l => {
			return l.Rel == "update";
		});
		helpers.incProgress();
		helpers
			.safeFetch(
				helpers.createRequest(updateLink.URL, {
					method: updateLink.Method,
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify(this.state.userConfig.Properties)
				})
			)
			.then(resp => resp.json())
			.then(js => {
				helpers.decProgress();
				Globals.userConfig = js;
				helpers.parseUserConfigColors();
				this.setState((state, props) => {
					state = Object.assign({}, state);
					state.userConfig = js;
					return state;
				});
			});
	}
	updatePhaseDeadline(ev) {
		ev.persist();
		this.setState(
			(state, props) => {
				state = Object.assign({}, state);
				let newValue = ev.target.value;
				if (newValue != "") {
					newValue = Number.parseInt(newValue);
				}
				state.userConfig.Properties.PhaseDeadlineWarningMinutesAhead = newValue;
				if (!state.userConfig.Properties.FCMTokens) {
					state.userConfig.Properties.FCMTokens = [];
				}
				return state;
			},
			_ => {}
		);
	}
	render() {
		return (
			<MaterialUI.Dialog
				onEntered={helpers.genOnback(this.close)}
				open={this.state.open}
				fullScreen
				disableBackdropClick={false}
				classes={{
					paper: helpers.scopedClass("margin: 2px; width: 100%;")
				}}
				onClose={this.close}
			>
				<MaterialUI.AppBar>
					<MaterialUI.Toolbar>
						<MaterialUI.IconButton
							edge="start"
							color="inherit"
							onClick={this.close}
							aria-label="close"
						>
							{helpers.createIcon("\ue5c4")}
						</MaterialUI.IconButton>
						<MaterialUI.Typography
							variant="h6"
							style={{ paddingLeft: "16px" }}
						>
							Settings
						</MaterialUI.Typography>
					</MaterialUI.Toolbar>
				</MaterialUI.AppBar>

				{this.state.userConfig ? (
					<React.Fragment>
						<div>
							<div
								style={{
									margin: "56px auto",
									padding: "0px 16px",
									display: "flex",
									flexDirection: "column",
									maxWidth: "940px"
								}}
							>
								<MaterialUI.Typography
									variant="subtitle2"
									style={{
										color: "rgba(40, 26, 26, 0.56)",
										padding: "16px 0px"
									}}
								>
									Notifications
								</MaterialUI.Typography>
								<div width="100%">
									<MaterialUI.FormControlLabel
										style={{
											width: "100%",
											maxWidth: "920px",
											paddingLeft: "0px"
										}}
										classes={{
											root: helpers.scopedClass(
												"padding-left:0px"
											)
										}}
										control={
											<MaterialUI.Switch
												checked={
													Globals.messaging
														.tokenEnabled
												}
												disabled={
													Globals.messaging
														.hasPermission ==
													"false"
												}
												onChange={ev => {
													const wantedState =
														ev.target.checked;
													helpers.incProgress();
													Globals.messaging
														.start()
														.then(js => {
															helpers.decProgress();
															let currentConfig = this
																.state
																.userConfig;
															if (js) {
																currentConfig = js;
															}
															this.setState(
																(
																	state,
																	props
																) => {
																	state = Object.assign(
																		{},
																		state
																	);
																	state.userConfig = currentConfig;
																	return state;
																},
																_ => {
																	if (
																		Globals
																			.messaging
																			.tokenOnServer
																	) {
																		if (
																			Globals
																				.messaging
																				.tokenEnabled !=
																			wantedState
																		) {
																			Globals.messaging.targetState = wantedState
																				? "enabled"
																				: "disabled";
																			helpers.incProgress();
																			const uploadPromise =
																				window.Wrapper &&
																				window
																					.Wrapper
																					.startFCM
																					? Globals.messaging.uploadToken()
																					: Globals.messaging.refreshToken();
																			uploadPromise.then(
																				js => {
																					helpers.decProgress();
																					this.setState(
																						{
																							config: js
																						}
																					);
																				}
																			);
																		} else {
																			this.forceUpdate();
																		}
																	} else {
																		this.forceUpdate();
																	}
																}
															);
														});
												}}
											/>
										}
										label="Push notifications"
									/>
									{firebase.messaging.isSupported() ||
									(window.Wrapper &&
										window.Wrapper.startFCM) ? (
										Globals.messaging.started ? (
											Globals.messaging.hasPermission ||
											(window.Wrapper &&
												window.Wrapper.startFCM) ? (
												Globals.messaging
													.tokenOnServer ? (
													Globals.messaging
														.tokenEnabled ? (
														""
													) : (
														""
													)
												) : (
													<p
														style={{
															marginTop: "2px"
														}}
													>
														<MaterialUI.Typography variant="caption">
															Notifications
															disabled [Error: no
															token uploaded]
														</MaterialUI.Typography>
													</p>
												)
											) : (
												<p style={{ marginTop: "2px" }}>
													<MaterialUI.Typography variant="caption">
														No notification
														permission received.
														<br />
														<a
															href="https://www.google.com/search?q=reset+browser+permission+notifications&rlz=1C5CHFA_enNL775NL775&oq=reset+browser+permission+notifications&aqs=chrome..69i57j69i60l2.3519j1j4&sourceid=chrome&ie=UTF-8"
															target="_blank"
														>
															Allow this sites
															notifications in
															your browser
															settings.
														</a>
													</MaterialUI.Typography>
												</p>
											)
										) : (
											<p style={{ marginTop: "2px" }}>
												<MaterialUI.Typography variant="caption">
													Notifications disabled
													[Error: notification system
													did not start]
												</MaterialUI.Typography>
											</p>
										)
									) : (
										<p style={{ marginTop: "2px" }}>
											<MaterialUI.Typography variant="caption">
												Notifications disabled [Error:
												Firebase Messaging not supported
												on your browser]
											</MaterialUI.Typography>
										</p>
									)}
								</div>

								<MaterialUI.FormControlLabel
									control={
										<MaterialUI.Switch
											checked={
												this.state.userConfig.Properties
													.MailConfig.Enabled
											}
											onChange={ev => {
												ev.persist();
												this.setState(
													(state, props) => {
														state = Object.assign(
															{},
															state
														);
														state.userConfig.Properties.MailConfig.Enabled =
															ev.target.checked;
														let hrefURL = new URL(
															location.href
														);
														state.userConfig.Properties.MailConfig.MessageConfig.TextBodyTemplate =
															"{{message.Body}}\n\nVisit {{unsubscribeURL}} to stop receiving email like this.\n\nVisit " +
															hrefURL.protocol +
															"//" +
															hrefURL.host +
															"/Game/{{game.ID.Encode}}  to see the latest phase in this game.";
														state.userConfig.Properties.MailConfig.PhaseConfig.TextBodyTemplate =
															"{{game.Desc}} has a new phase: " +
															hrefURL.protocol +
															"//" +
															hrefURL.host +
															"/Game/{{game.ID.Encode}}.\n\nVisit %s to stop receiving email like this.";
														return state;
													},
													this.saveConfig
												);
											}}
										/>
									}
									label="Email notifications"
								/>
								<MaterialUI.TextField
									inputProps={{ min: 0 }}
									fullWidth
									style={{
										marginTop: "1px",
										maxWidth: "180px"
									}}
									disabled={
										!this.state.userConfig.Properties
											.MailConfig.Enabled &&
										!Globals.messaging.tokenEnabled
									}
									type="number"
									label="Phase deadline reminder"
									helperText={
										this.state.userConfig.Properties
											.MailConfig.Enabled ||
										Globals.messaging.tokenEnabled
											? "In minutes. 0 = off"
											: "Turn on notifications to receive alarms"
									}
									margin="dense"
									value={
										this.state.userConfig.Properties
											.PhaseDeadlineWarningMinutesAhead
									}
									onChange={this.updatePhaseDeadline}
									onBlur={this.saveConfig}
								/>
								<MaterialUI.Typography
									variant="subtitle2"
									style={{
										color: "rgba(40, 26, 26, 0.56)",
										marginTop: "16px",
										padding: "16px 0px"
									}}
								>
									Custom nation colours
								</MaterialUI.Typography>

								<div
									className={helpers.scopedClass(
										"display: flex; flex-direction: column"
									)}
								>
									<MaterialUI.FormControl
										style={{ marginBottom: "8px" }}
									>
										<MaterialUI.InputLabel
											shrink
											id="variantinputlabel"
										>
											Variant
										</MaterialUI.InputLabel>
										<MaterialUI.Select
											fullWidth
											labelId="variantinputlabel"
											value={
												this.state
													.newColorOverrideVariant
											}
											onChange={ev => {
												const variant = Globals.variants.find(
													v => {
														return (
															v.Properties.Name ==
															ev.target.value
														);
													}
												);
												let nation = this.state
													.newColorOverrideNation;
												if (
													variant.Properties.Nations.indexOf(
														nation
													) == -1
												) {
													nation =
														variant.Properties
															.Nations[0];
												}
												this.setState({
													newColorOverrideNation: nation,
													newColorOverrideVariant:
														ev.target.value
												});
											}}
										>
											{Globals.variants.map(variant => {
												return (
													<MaterialUI.MenuItem
														key={
															variant.Properties
																.Name
														}
														value={
															variant.Properties
																.Name
														}
													>
														{
															variant.Properties
																.Name
														}
													</MaterialUI.MenuItem>
												);
											})}
										</MaterialUI.Select>
									</MaterialUI.FormControl>

									<div
										style={{
											display: "flex",
											flexDirection: "column",
											marginBottom: "200px"
										}}
									>
										{Globals.variants
											.find(v => {
												return (
													v.Properties.Name ==
													this.state
														.newColorOverrideVariant
												);
											})
											.Properties.Nations.map(
												(nation, index) => {
													return (
														<div
															style={{
																display: "flex",
																height: "48px",
																alignItems:
																	"center"
															}}
															key={nation}
															value={nation}
														>
															<MaterialUI.Typography>
																{nation}
															</MaterialUI.Typography>

															<div
																style={{
																	marginLeft:
																		"auto",
																	display:
																		"flex",
																	alignItems:
																		"center"
																}}
															>
																<Color
																	className={helpers.scopedClass(
																		"flex-grow: 0; margin-right: 4px;"
																	)}
																	value={
																		Globals
																			.colorOverrides
																			.variants[
																			this
																				.state
																				.newColorOverrideVariant
																		][
																			nation
																		] &&
																		Globals
																			.contrastColors[
																			index
																		] !==
																			Globals
																				.colorOverrides
																				.variants[
																				this
																					.state
																					.newColorOverrideVariant
																			][
																				nation
																			]
																			? Globals
																					.colorOverrides
																					.variants[
																					this
																						.state
																						.newColorOverrideVariant
																			  ][
																					nation
																			  ]
																			: Globals
																					.contrastColors[
																					index
																			  ]
																	}
																	edited={
																		Globals
																			.colorOverrides
																			.variants[
																			this
																				.state
																				.newColorOverrideVariant
																		][
																			nation
																		] &&
																		Globals
																			.contrastColors[
																			index
																		] !==
																			Globals
																				.colorOverrides
																				.variants[
																				this
																					.state
																					.newColorOverrideVariant
																			][
																				nation
																			]
																			? false
																			: true
																	}
																	onSelect={col => {
																		this.setState(
																			{
																				newColorOverrideColor: col
																			}
																		);
																	}}
																/>
															</div>

															{/*TODO: Below is the "delete" button. This should have an onClick that deletes this variant and reloads the <color> element to the default colour*/}

															{Globals
																.colorOverrides
																.variants[
																this.state
																	.newColorOverrideVariant
															][nation] &&
															Globals
																.contrastColors[
																index
															] !==
																Globals
																	.colorOverrides
																	.variants[
																	this.state
																		.newColorOverrideVariant
																][nation] ? (
																<div
																	style={{
																		color:
																			"#281A1A"
																	}}
																>
																	{helpers.createIcon(
																		"\ue872"
																	)}
																</div>
															) : (
																""
															)}
														</div>
													);
												}
											)}
									</div>

									{/* TODO: All code in relation to the nation (and maybe position) could be removed. Maybe keep the position implementation so (a) we can add it later as advanced option and (b) we can handle legacy applications gracefully.
For current implementation, it's not needed, though.*/}
									<MaterialUI.Select
										value={
											this.state.newColorOverrideNation
										}
										className={helpers.scopedClass(
											"flex-grow: 1;"
										)}
										onChange={ev => {
											this.setState({
												newColorOverrideNation:
													ev.target.value
											});
										}}
									>
										{(this.state.newColorOverrideType ==
										"nation"
											? this.allNations
											: Globals.variants.find(v => {
													return (
														v.Properties.Name ==
														this.state
															.newColorOverrideVariant
													);
											  }).Properties.Nations
										).map(nation => {
											return (
												<MaterialUI.MenuItem
													key={nation}
													value={nation}
												>
													{nation}
												</MaterialUI.MenuItem>
											);
										})}
									</MaterialUI.Select>
									<Color
										className={helpers.scopedClass(
											"flex-grow: 0;"
										)}
										value={this.state.newColorOverrideColor}
										onSelect={col => {
											this.setState({
												newColorOverrideColor: col
											});
										}}
									/>
								</div>

								{/* TODO: In the applied overrides list, maybe we still populate this for Position overrides (including delete button) so legacy users can still remove and see their old overrides. OR, we just delete it; I'll leave it up to you.  Maybe also for "nations", but I guess that no one except for 2 users used that feature.*/}

								<MaterialUI.List>
									{(_ => {
										let overridePos = 0;
										return (
											this.state.userConfig.Properties
												.Colors || []
										).map((color, idx) => {
											if (color == "") {
												return "";
											}
											const parts = color.split("/");
											if (parts.length == 1) {
												return (
													<MaterialUI.ListItem
														button
														key={
															"override_" +
															overridePos +
															"_" +
															color
														}
													>
														<div
															className={helpers.scopedClass(
																"flex: 1 1 auto;"
															)}
														>
															Override{" "}
															<span
																style={{
																	backgroundColor:
																		Globals
																			.contrastColors[
																			overridePos
																		]
																}}
															>
																position
																{" " +
																	overridePos++}
															</span>
														</div>
														<Color
															value={color}
															onSelect={this.newColorSetter(
																idx,
																""
															)}
														/>
														<MaterialUI.ListItemSecondaryAction>
															<MaterialUI.IconButton
																edge="end"
																onClick={this.newColorDeleter(
																	idx
																)}
															>
																{helpers.createIcon(
																	"\ue92b"
																)}{" "}
																{/* delete */}
															</MaterialUI.IconButton>
														</MaterialUI.ListItemSecondaryAction>
													</MaterialUI.ListItem>
												);
											} else if (parts.length == 2) {
												return (
													<MaterialUI.ListItem
														button
														key={
															"nation_" +
															parts[0] +
															"_" +
															parts[1]
														}
													>
														<MaterialUI.ListItemText
															primary={
																"Override " +
																Globals
																	.colorOverrides
																	.nationCodes[
																	parts[0]
																]
															}
														/>
														<Color
															value={parts[1]}
															onSelect={this.newColorSetter(
																idx,
																parts[0] + "/"
															)}
														/>
														<MaterialUI.ListItemSecondaryAction>
															<MaterialUI.IconButton
																edge="end"
																onClick={this.newColorDeleter(
																	idx
																)}
															>
																{helpers.createIcon(
																	"\ue92b"
																)}
															</MaterialUI.IconButton>
														</MaterialUI.ListItemSecondaryAction>
													</MaterialUI.ListItem>
												);
											} else if (parts.length == 3) {
												return (
													<MaterialUI.ListItem
														button
														key={
															"variant_" +
															parts[0] +
															"_nation_" +
															parts[1] +
															"_" +
															parts[2]
														}
													>
														<MaterialUI.ListItemText
															primary={
																"Override " +
																Globals
																	.colorOverrides
																	.nationCodes[
																	parts[1]
																] +
																" in " +
																Globals
																	.colorOverrides
																	.variantCodes[
																	parts[0]
																]
															}
														/>
														<Color
															value={parts[2]}
															onSelect={this.newColorSetter(
																idx,
																parts[0] +
																	"/" +
																	parts[1] +
																	"/"
															)}
														/>
														<MaterialUI.ListItemSecondaryAction>
															<MaterialUI.IconButton
																edge="end"
																onClick={this.newColorDeleter(
																	idx
																)}
															>
																{helpers.createIcon(
																	"\ue92b"
																)}
															</MaterialUI.IconButton>
														</MaterialUI.ListItemSecondaryAction>
													</MaterialUI.ListItem>
												);
											}
										});
									})()}
								</MaterialUI.List>

								{/* TODO: When the use presses "Select", the override should immediately be applied. it's okay if the page needs to load for a bit. */}

								<MaterialUI.Button
									onClick={this.addColorOverride}
									color="primary"
								>
									Add color override
								</MaterialUI.Button>
							</div>
						</div>
					</React.Fragment>
				) : (
					""
				)}
			</MaterialUI.Dialog>
		);
	}
}
