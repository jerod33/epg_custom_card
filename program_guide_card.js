import {
  LitElement,
  html,
  css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class ProgramGuideCard extends LitElement {
  static get properties() {
    return {
      query: { type: String },
      data: { type: Array },
      _hass: { type: Object },
      filter: { type: String },
      config: { type: Object },
      programData: { type: Array },
      channelInfo: { type: Object },
      channelNames: { type: Array }
    };
  }
//todo - nahradit v query pro prepinani mezi dennim a aktualnim vysledkem vyhledavani id za vyhledavani nazvu kanalu
  constructor() {
    super();
    this.programData = [];
    this.channelNames = [];
    this.showRemote = false;
    console.info(
      `%c EPG V 0.1.4 %c  `,
      'color: white; background: blue; font-weight: 700;',
      'color: blue; background: white; font-weight: 700;',
    );
  }

  setConfig(config) {
    if (!config.epg_today || !config.epg_yesterday || !config.channel_info) {
      throw new Error("Je potřeba definovat epg_today, epg_yesterday nebo channel_info v konfiguraci.");
    }
    this.config = config;
  }

  async connectedCallback() {
    super.connectedCallback();
  }

  set hass(hass) {
    this._hass = hass;

    if (!hass || !hass.states || !this.config) return;

    if (this.config.show_remote) {
      this.showRemote = this.config.show_remote;
    } else {
      this.showRemote = false;
    }

    const todaySensorState = hass.states[this.config.epg_today];
    const yesterdaySensorState = hass.states[this.config.epg_yesterday];

    if (!todaySensorState || !yesterdaySensorState) return;

    const combinedData = [...todaySensorState.attributes.data, ...yesterdaySensorState.attributes.data];
    this.combinedData = combinedData;
    const now = new Date();

  
    const filteredData = [];
    this.config.channel_info.forEach(channel => {
      const channelData = combinedData.filter(entry => entry.channel_name === channel.name);
      const currentProgram = channelData.find(entry => new Date(entry.Start) <= now && new Date(entry.Stop) >= now);
      const nextProgram = channelData.find(entry => new Date(entry.Start) > now);
      if (currentProgram && nextProgram) {
        filteredData.push({ channelName: channel.name, tv_channel_number: channel.tv_channel_number, current: currentProgram, next: nextProgram });
      }
    });

    // Uložení filtrovaných dat
    this.programData = filteredData;
  }

updateQuery(element) {
    if (element) {
        const channelName = element.srcElement.id;
        this.query = channelName;
         console.log("Updated Query: ", this.query); //  
        this._toggleMenu();
    }
}

  handleClickOnDetails(start, id) {
    let details = this.shadowRoot.querySelectorAll("details");
    this.updateSomeOtherSensor(start, id);
    details.forEach((targetDetail) => {
      targetDetail.addEventListener("click", () => {
        details.forEach((detail) => {
          if (detail !== targetDetail) {
            detail.removeAttribute("open");
          }
        });
      });
    });
  }

  updateSomeOtherSensor(start, id) {
    const dataString = `datum=${start}&id_tv=${id}`;
    this._hass.callService('input_text', 'set_value', {
      entity_id: 'input_text.epg_description_query',
      value: dataString
    });
  }

  render() {
    const logoPath = this.config.logoPath || "/local/loga_velka/";
    const iconPath = this.config.iconPath || "/local/icon/" ;
   
   
    return html`
      <link rel="stylesheet" type="text/css" href="" />
      <div class='epg-container'>
        <header class='epg-container-header'>
          <span class='logo'><img src="${logoPath}epg.png" @click="${ev => this._toggleEpg()}"></span>
          <nav class='vertical-align-middle scroll'>
            ${this.programData.map(program => {
              return program.current
                ? html`<span class='nav-item'><img src="${logoPath}${program.current.logo_url}" id="${program.channelName}" @click="${this.updateQuery} "></span>`
                : html`<div class="not-found">Entity ${program.current.entity} not found.</div>`;
            })}
          </nav>
        </header>
      </div>
      
      <div id="on_air">  
        ${this.programData.map(program => html`
          <section id="page">
            <aside class="side"><img src="${logoPath}${program.current.logo_url}" @click="${ev => this._ch_switch(program.tv_channel_number)}"></aside>
            <main>
              <details class="content">
                <summary >
                  <span class="time">${this.formatTime(program.current.Start)}</span>
                  <span @click="${ev => this.handleClickOnDetails(program.current.Start, program.tv_channel_number)}" class="summary-title" data-start="${program.current.Start}" data-id="${program.current.tv_channel_number}">${program.current.Title}</span>
                </summary>
                <div class="summary-content">${program.current.short_description}</div>
                <div>
                  <p class="minutes">${program.current.date}</p>
                  <p class="type">${program.current.country}</p>
                  <p class="type">${program.current.Category}</p>
                </div>    
              </details> 
              <div></div> 
              <div>  
                <div class="d1">
                  <div class="d2" style="width: ${this.calculateProgramWidth(program.current.Start, program.current.Stop)}%;"></div>      
                </div>  
              </div>
              <details>
                <summary>
                  <span>${this.formatTime(program.next.Start)}</span>
                  <span @click="${ev => this.handleClickOnDetails(program.next.Start, program.next.id_tv)}" class="summary-title">${program.next.Title}</span> 
                </summary>
                <div class="summary-content">${program.next.short_description}</div>
              </details>
            </main>
          </section>
        `)}
        
        ${this.showRemote ? html`
          <div class="remote">
            <input type="checkbox" name="remoteToggle" class="remoteToggle" />
            <img src="${iconPath}remote-tv_36.png"/> 
            <div class="remoteButtons">
              ${this.config.tv_control_method === 'webostv' ? html`
                <a href="#" title="Vypnout"><img src="${iconPath}power-off.png" style="width: 42px;opacity: 0.3;" @click="${ev => this._remote('EXIT')}" /> 
                <span class="timeStop" style="position: absolute; top: 12px; left: 7px; font-size: 14px;">EXIT</span>
                </a>
              ` : html`
                <a href="#" title="Vypnout"><img src="${iconPath}power-off.png" style="width: 42px;" @click="${ev => this._remote('POWER')}" /></a>
              `}
              <a href="#" title="Mute"><img src="${iconPath}volume_mute_2_36.png" style="width: 42px;" @click="${ev => this._remote('MUTE')}"/></a>
              <a href="#" title="Zvýšit hlasitost"><img src="${iconPath}volume_up_2_36.png" style="width: 42px; position: relative;" @click="${ev => this._remote('VOLUMEUP')}"/>
                <span class="timeStop" style="position: absolute; top: 12px; left: 7px; font-size: 14px; color: white;" @click="${ev => this._remote('VOLUMEUP')}">${this.calculateVolumeLevel()}</span>
              </a>
              <a href="#" title="Snížit hlasitost"><img src="${iconPath}volume_down_2_36.png" style="width: 42px; position: relative;" @click="${ev => this._remote('VOLUMEDOWN')}"/>
                <span class="timeStop" style="position: absolute; top: 12px; left: 7px; font-size: 14px; color: white;" @click="${ev => this._remote('VOLUMEDOWN')}">${this.calculateVolumeLevel()}</span>
              </a>
            </div>
          </div>
        ` : ''}
      </div>
      
      <div id="full_day">
        ${this.combinedData
          .filter(entry => (new Date() >= new Date(entry.Start) && new Date() <= new Date(entry.Stop)) || new Date() < new Date(entry.Start))
          .filter(entry => entry.channel_name === this.query)
          .map(entry => html`
            <section id="page_full">
              <aside class="side">
              <span class="time" >${this.formatTime(entry.Start)}</span><br>
              <span class="timeStop">${this.formatTime(entry.Stop)}</span>
              </aside>
              <main>
                <details class="content">
                  <summary>
                    <span @click="${ev => this.handleClickOnDetails(entry.Start, entry.tv_channel_number)}" class="summary-title">${entry.Title}</span>
                  </summary>
                  <div class="summary-content">${entry.short_description}</div>
                  <div>
                    <p class="minutes">${entry.date}</p>
                    <p class="type">${entry.country}</p>
                    <p class="type">${entry.Category}</p>
                  </div>    
                </details>
                <div></div>
 
              </main>
            </section>
          `)
        }
      </div>
    `;
  }

  formatTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  calculateVolumeLevel() {
    if (!this._hass || !this._hass.states || !this.config) return 0;
    const state = this._hass.states[this.config.entity_id];
    return state ? state.attributes.volume_level * 100 : 0;
  }

  calculateProgramWidth(start, stop) {
    const startTime = new Date(start);
    const endTime = new Date(stop);
    const now = new Date();
    const totalDuration = endTime - startTime;
    const elapsedDuration = now - startTime;
    return Math.min((elapsedDuration / totalDuration) * 100, 100);
  }

  _toggleMenu() {
    this.shadowRoot.getElementById("full_day").style.display = "block";
    this.shadowRoot.getElementById("on_air").style.display = "none";
     this.updateQuery();
  }
  _toggleEpg() {
    this.shadowRoot.getElementById("on_air").style.display = "block";
    this.shadowRoot.getElementById("full_day").style.display = "none";
  }

  _ch_switch(tv_channel_id) {
    if (this.config.tv_control_method === 'webostv') {
      
      this._hass.callService("webostv", "command", {
        entity_id: this.config.entity_id,
        command: "tv/openChannel",
        payload: { channelId: tv_channel_id }
      });
    } 
    else 
      if (this.config.tv_control_method === 'remote') {
  
      const device = this.config.remote_device || "television"; //   výchozí hodnotu odstranit
    var tv_channel_id_str = tv_channel_id.toString();
      if (tv_channel_id_str.length > 1) {
      var ent_id = [];
          for (var i = 0; i < tv_channel_id_str.length; i++) {
          
              ent_id.push('kanal ' + tv_channel_id_str[i]);
          }
      } else {
          var ent_id = 'kanal ' + tv_channel_id;
      }
  
  
     this._hass.callService("remote", "send_command", {
        entity_id: "remote.ovladac_remote",
        device: this.config.remote_device || "television", //   výchozí hodnotu odstranit
        command: ent_id
      });
    
    
       
    console.log("command:", ent_id);
    console.log("device:", this.config.remote_device || "television"); //   výchozí hodnotu odstranit
    }
  }

  _remote(state) {
    if (this.config.tv_control_method === 'webostv') {
      this._hass.callService("webostv", "button", {
        entity_id: this.config.entity_id,
        button: state
      });
    } else if (this.config.tv_control_method === 'remote') {
      this._hass.callService("remote", "send_command", {
        entity_id: this.config.entity_id,  
        device: this.config.remote_device || "television", //   výchozí hodnotu odstranit
        command: state
      });
    }
  }

  static get styles() {
    return css`
    .scroll {
      white-space: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      -ms-overflow-style: -ms-autohiding-scrollbar;
    }
   
    .epg-container {
      position: sticky;
      top: 5px;
      margin-bottom: 2px;
      border: 2px solid;
      -webkit-box-shadow: 0 8px 6px -6px black;
      -moz-box-shadow: 0 8px 6px -6px black;
      box-shadow: 0 8px 6px -6px black;
    }
   
    .epg-container-header .logo {
      width: 25%;
    }
   
    .epg-container-header nav {
      width: 75%;
    }
   
    header {
      background: #152637;
    }
   
    #full_day {
      display: none;
    }
   
    .epg-container-header {
      overflow: hidden;
      height: 100px;
      background: rgb(229, 230, 230);
      top: 0;
      width: auto;
    }
   
    .logo {
      text-align: center;
      font-weight: 700;
      color: #727c87;
      border-right: 1px solid rgba(114, 124, 135, 0.4);
      padding: 12px 24px 13px;
    }
   
    .nav-item {
      padding: 12px 16px 13px;
      display: block;
      color: #f2f2f2;
      text-decoration: none;
    }
   
    .nav-item:not(:last-child) {
      border-right: 1px solid rgba(114, 124, 135, 0.2);
    }
   
    * {
      box-sizing: border-box;
    }
   
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
      max-width: 492px;
      margin: 10vmin auto 0;
      color: #64cce3;
      line-height: 1.5;
    }
   
    header,
    nav {
      font-size: 0;
    }
   
    .logo,
    .nav-item {
      font-size: 14px;
    }
   
    .logo,
    .nav-item,
    .vertical-align-middle {
      display: inline-block;
      vertical-align: middle;
    }
   
    .scroll::-webkit-scrollbar {
      display: none;
    }
   
    #page {
      display: grid;
      width: 100%;
      border: 1px solid;
      background: #e5e6e6;
      margin-bottom: 4px;
      grid-template-areas: "head head" "aside  main";
      grid-template-columns: 100px 1fr;
    }
    
      #page_full {
      display: grid;
      width: 100%;
      border: 1px solid;
      background: #e5e6e6;
      margin-bottom: 4px;
      grid-template-areas: "head head" "aside  main";
      grid-template-columns: 100px 1fr;
    }
   
    span {
      font-size: 1.3em;
    }
   
    .minutes {
      display: inline-block;
      margin-top: 15px;
      color: #555;
      padding: 5px;
      border-radius: 5px;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
   
    p {
      display: inline-block;
      border-radius: 5px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      margin-left: 10px;
    }
   
    #page > header {
      grid-area: head;
      background-color: #8ca0ff;
    }
   
    #page > aside {
      grid-area: aside;
      display: flex;
    }
   
   
    #page > main {
      grid-area: main;
      color: black;
    }
    
    
     #page_full > header {
      grid-area: head;
      background-color: #8ca0ff;
    }
    
    #page_full > main {
      grid-area: main;
      color: black;
    }
    
        #page_full > aside {
      grid-area: aside;
      
    }
   
    img {
      display: inline-block;
      margin: auto;
      max-width: 90px;
    }
   
    .time {
      color: red;
      height: 100%;
    }
    .timeStop {
      color: black;
      height: 100%;
    }
   
    details {
           
            margin: 10px auto;
            background: #ffffff;
             text-overflow: ellipsis;
       
            background: #e5e6e6;
            /*background: linear-gradient(to right, #e5e6e6 70%, transparent 100%);*/
           
             
          }
          details .summary-title {
            -webkit-user-select: none;
               -moz-user-select: none;
                -ms-user-select: none;
                    user-select: none;
            margin-left: 5px;
            color: black;
              font-family: Arial, Helvetica, sans-serif;
                  font-size: 1.3em;
            
          }
          details .summary-content {
              
              border-top: 1px solid #e2e8f0;
              cursor: default;
              padding: 1em;
              font-weight: 300;
              line-height: 1.5;
            font-family: "Montserrat", helvetica, arial, sans-serif;
             
           }   
          details summary:focus {
            outline: none;
          }
          details summary::-webkit-details-marker {
            display: none;
           
          } 
          summary {
            list-style-type: none;
          }
   
    .d1 {
      height: 6px;
      width: 100%;
      background-color: #ddd;
    }
   
    .d2 {
      height: 6px;
      background-color: #D80001;
    }
   
    .floating-button {
      position: sticky;
      z-index: 100;
      width: 50px;
      height: 50px;
      background: #E91E63;
      color: #FFF;
      font-size: 2em;
      border-radius: 50%;
      top: 90vh;
      left: 100%;
      margin-top: -25px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.26);
      transition: all 0.3s linear;
      overflow-x: hidden;
    }
   
    .floating-button:hover {
      box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.3);
      margin-top: -30px;
    }
   
    .floating-button:active {
      box-shadow: 0 10px 15px 0 rgba(0, 0, 0, 0.4);
      margin-top: -32px;
      background: #EC407A;
    }
   .remote {
        position: sticky;
        bottom: 100px;
        right: 35px;
        margin-left: 80%;
    }
    
   
    .remoteControl {
      position: sticky;
      bottom: 100px;
      right: 35px;
      margin-left: 80%;
    }
   
    .remoteButton {
      height: 60px;
      width: 60px;
      background-color: rgba(67, 83, 143, .8);
      border-radius: 50%;
      display: block;
      color: #fff;
      text-align: center;
      position: relative;
      z-index: 1;
    }
   
    .remoteButton i {
      font-size: 22px;
    }
   
    .remoteButtons {
      position: absolute;
      width: 100%;
      bottom: 120%;
      text-align: center;
    }
   
    .remoteButtons a {
      display: block;
      width: 43px;
      height: 43px;
      border-radius: 50%;
      text-decoration: none;
      margin: 25px 25px 0;
      line-height: 1.15;
      color: #fff;
      opacity: 0;
      visibility: hidden;
      position: relative;
    }
   
    .remoteButtons a:hover {
      transform: scale(1.05);
    }
   
    .remoteButtons a:nth-child(1) {
      background-color: transparent;
      transition: opacity .2s ease-in-out .3s, transform .15s ease-in-out;
    }
   
    .remoteButtons a:nth-child(2) {
      background-color: transparent;
      transition: opacity .2s ease-in-out .25s, transform .15s ease-in-out;
    }
   
    .remoteButtons a:nth-child(3) {
      background-color: transparent;
      transition: opacity .2s ease-in-out .2s, transform .15s ease-in-out;
    }
   
    .remoteButtons a:nth-child(4) {
      background-color: transparent;
      transition: opacity .2s ease-in-out .15s, transform .15s ease-in-out;
    }
   
    .remoteControl a i {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
   
    .remoteToggle {
      -webkit-appearance: none;
      position: absolute;
      border-radius: 50%;
      top: 0;
      left: 0;
      margin: 0;
      width: 100%;
      height: 85%;
      cursor: pointer;
      background-color: transparent;
      border: none;
      outline: none;
      z-index: 2;
      transition: box-shadow .2s ease-in-out;
    }
   
    .remoteToggle:checked ~ .remoteButtons a {
      opacity: 1;
      visibility: visible;
    }
    `;
  }
}

customElements.define('program-guide-card', ProgramGuideCard);
