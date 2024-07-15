import {
  LitElement,
  html,
  css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

// Definice konstanty pro cestu k logům
const LOGA_VELKA_PATH = '/local/loga_velka/';

class ProgramGuideCard extends LitElement {
  static get properties() {
    return {
      query: { type: String },
      data: { type: Array },
      _hass: { type: Object },
      filter: { type: String },
      config: { type: Object },
      programData: { type: Array },
      channelInfo: { type: Object }
    };
  }

  constructor() {
    super();
    this.programData = [];
  }

  setConfig(config) {
    if (!config.epg_today || !config.epg_yesterday || !config.channel_info) {
      throw new Error("You need to define epg_today, epg_yesterday, and channel_info in the configuration.");
    }
    this.config = config;
  }

  async connectedCallback() {
    super.connectedCallback();
    // await this.loadChannelInfo();
  }

  set hass(hass) {
    this._hass = hass;

    if (!hass || !hass.states || !this.config) return;

    const todaySensorState = hass.states[this.config.epg_today];
    const yesterdaySensorState = hass.states[this.config.epg_yesterday];

    if (!todaySensorState || !yesterdaySensorState) return;

    const combinedData = [...todaySensorState.attributes.data, ...yesterdaySensorState.attributes.data];
    this.combinedData = combinedData;
    const now = new Date();

    // Filtrujeme pouze aktuálně vysílaný program a jeden následující program pro každý kanál
    const filteredData = [];
    this.config.channel_info.forEach(channel => {
      const channelData = combinedData.filter(entry => entry.channel_id_tv === channel.id_tv);
      const currentProgram = channelData.find(entry => new Date(entry.Start) <= now && new Date(entry.Stop) >= now);
      const nextProgram = channelData.find(entry => new Date(entry.Start) > now);
      if (currentProgram && nextProgram) {
        filteredData.push({ channelName: channel.name, current: currentProgram, next: nextProgram });
      }
    });

    // Uložení filtrovaných dat
    this.programData = filteredData;
  }

  updateQuery(element) {
    if (element) {
      this.query = element.srcElement.id;
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
    return html`
      <link rel="stylesheet" type="text/css" href="/local/scripts/ane.css" />
      <div class='epg-container'>
        <header class='epg-container-header'>
          <span class='logo'><img src="${LOGA_VELKA_PATH}epg.png" @click="${ev => this._toggleEpg()}"></span>
          <nav class='vertical-align-middle scroll'>
            ${this.programData.map(program => {
              return program.current
                ? html`
                  <span class='nav-item'><img src="${LOGA_VELKA_PATH}${program.current.channelLogo}" id="${program.current.channel_id_tv}" @click="${this.updateQuery} "></span>`
                : html`
                  <div class="not-found">Entity ${program.current.entity} not found.</div>`;
            })}
          </nav>
        </header>
      </div>

      <div id="on_air">  
        ${this.programData.map(program => html`
          <section id="page">
            <aside class="side"><img src="${LOGA_VELKA_PATH}${program.current.channelLogo}" @click="${ev => this._ch_switch(program.current.channel_id_tv)}"></aside>
            <main>
              <details class="content">
                <summary >
                  <span class="time">${program.current.startTime}</span>
                  <span @click="${ev => this.handleClickOnDetails(program.current.Start, program.current.id_tv)}" class="summary-title" data-start="${program.current.Start}" data-id="${program.current.id_tv}">${program.current.Title}</span>
                </summary>
                <div class="summary-content">${program.current.short_description}</div>
                <div>
                  <p class="minutes">${program.current.date}</p>
                  <p class="type">${program.current.country}</p>
                  <p class="type">${program.current.Category}</p>
                </div>    
              </details> 
              <div ></div> 
              <div >  
                <div class="d1" >
                  <div class="d2" style="width: ${this.calculateProgramWidth(program.current.Start, program.current.Stop)}%;">    
                  </div>      
                </div>  
              </div>
              <details class="">
                <summary>
                  <span>${program.next.startTime}</span>
                  <span @click="${ev => this.handleClickOnDetails(program.next.Start, program.next.id_tv)}" class="summary-title">${program.next.Title}</span> 
                </summary>
                <div class="summary-content">${program.next.short_description}</div>
              </details>
            </main>
          </section>
        `)}
        
        ${this.config.show_remote ? html`
          <div class="remote">
            <input type="checkbox" name="remoteToggle" class="remoteToggle" />
            <img src="${LOGA_VELKA_PATH}remote-tv_36.png"/> 
            <div class="remoteButtons">
              ${this.config.tv_control_method === 'webostv' ? html`
                <a href="#" title="Vypnout"><img src="${LOGA_VELKA_PATH}power-off.png" style="width: 42px;opacity: 0.3;" @click="${ev => this._remote('EXIT')}" /> 
                <span class="timeStop" style="position: absolute; top: 12px; left: 7px; font-size: 14px;  ">EXIT</span>
                </a>
              ` : html`
                <a href="#" title="Vypnout"><img src="${LOGA_VELKA_PATH}power-off.png" style="width: 42px;" @click="${ev => this._remote('POWER')}" /> </a>
              `}
              <a href="#" title="Mute"><img src="${LOGA_VELKA_PATH}volume_mute_2_36.png" style="width: 42px;" @click="${ev => this._remote('MUTE')}"/></a>
              <a href="#" title="Zvýšit hlasitost"><img src="${LOGA_VELKA_PATH}volume_up_2_36.png" style="width: 42px; position: relative;" @click="${ev => this._remote('VOLUMEUP')}"/>
                <span class="timeStop" style="position: absolute; top: 12px; left: 7px; font-size: 14px; color: white;" @click="${ev => this._remote('VOLUMEUP')}">${this.calculateVolumeLevel()}</span>
              </a>
              <a href="#" title="Snížit hlasitost"><img src="${LOGA_VELKA_PATH}volume_down_2_36.png" style="width: 42px; position: relative;" @click="${ev => this._remote('VOLUMEDOWN')}"/>
                <span class="timeStop" style="position: absolute; top: 12px; left: 7px; font-size: 14px; color: white;" @click="${ev => this._remote('VOLUMEDOWN')}">${this.calculateVolumeLevel()}</span>
              </a>
              <a href="#" title="Následující kanál"><img src="${LOGA_VELKA_PATH}channel-up.png" style="width: 42px;" @click="${ev => this._remote('CHANNELUP')}"/></a>
              <a href="#" title="Předchozí kanál"><img src="${LOGA_VELKA_PATH}channel-down.png" style="width: 42px;" @click="${ev => this._remote('CHANNELDOWN')}"/></a>
            </div>
          </div>
        ` : ''}
      </div>
      
      <div id="full_day">
        ${this.combinedData
          .filter(entry => (new Date() >= new Date(entry.Start) && new Date() <= new Date(entry.Stop)) || new Date() < new Date(entry.Start))
          .filter(entry => entry.channel_id_tv === this.query)
          .map(entry => html`
            <section id="page_full">
              <aside class="side">
                <span class="time" @click="${ev => this._ch_switch(entry)}">${entry.startTime}</span>
                <a class="title" href="${this._hass.states.input_text.epg_description_query.state}"> Detail </a>
              </aside>
              <main>
                <details class="content" @click="${this._ch_switch}" @click="${this._hass}">
                  <summary>${entry.Title}</summary>
                  <div class="summary-content">${entry.short_description}</div>
                </details>
              </main>
            </section>
          `)}
      </div>

      <ha-card style="height: 500px;">
        <style>
          .header {
            margin: auto;
            margin-top: 0;
            padding-top: 10px;
            padding-bottom: 10px;
            text-align: center;
            font-size: 20px;
          }
        </style>
        <h1 class="header">Annie</h1>
        <div class="hover-content">
          <img src="/local/scripts/ane/annie-logo.png" style="width: 100px;">
          <br> 
          <a href="https://github.com/anzion94" target="_blank"> My GitHub </a>
          <br>
          <a href="https://www.linkedin.com/in/ann-rom/" target="_blank"> LinkedIn</a>
          <br>
        </div>
      </ha-card>
    `;
  }

  _ch_switch(programData) {
    this.hass.callService('input_text', 'set_value', {
      entity_id: 'input_text.epg_description_query',
      value: programData.date
    });
  }

  _toggleEpg() {
    this.hass.callService('input_text', 'toggle', {
      entity_id: 'input_text.epg_description_query'
    });
  }

  _toggleMenu() {
    this.hass.callService('input_text', 'toggle', {
      entity_id: 'input_text.epg_description_query'
    });
  }

  _remote() {
    this.hass.callService('input_text', 'select', {
      entity_id: 'input_text.epg_description_query'
    });
  }

  calculateVolumeLevel(data) {
    this.shadowRoot.querySelectorAll("summary");
  }
}

customElements.define("program-guide-card", ProgramGuideCard);
