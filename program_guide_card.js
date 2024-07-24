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

  constructor() {
    super();
    this.programData = [];
    this.channelNames = [];
    this.showRemote = false;
    console.info(
      `%c EPG V 05.1 %c  `,
      'color: white; background: blue; font-weight: 700;',
      'color: blue; background: white; font-weight: 700;',
    );
  }

  setConfig(config) {
    if (!config.epg_today || !config.epg_yesterday || !config.channel_info) {
      throw new Error("You need to define epg_today, epg_yesterday, and channel_info in the configuration.");
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

    // Filtrujeme pouze aktuálně vysílaný program a jeden následující program pro každý kanál
    const filteredData = [];
    this.config.channel_info.forEach(channel => {
      const channelData = combinedData.filter(entry => entry.channelName === channel.name);
      const currentProgram = channelData.find(entry => new Date(entry.Start) <= now && new Date(entry.Stop) >= now);
      const nextProgram = channelData.find(entry => new Date(entry.Start) > now);
      if (currentProgram && nextProgram) {
        filteredData.push({ channelName: channel.name, id_tv: channel.id_tv, current: currentProgram, next: nextProgram });
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
          <span class='logo'><img src="/local/loga_velka/epg.png" @click="${ev => this._toggleEpg()}"></span>
          <nav class='vertical-align-middle scroll'>
            ${this.programData.map(program => {
              return program.current
                ? html`<span class='nav-item'><img src="/local/program_guide/loga_velka/${program.current.channelLogo}" id="${program.current.channel_id_tv}" @click="${this.updateQuery} "></span>`
                : html`<div class="not-found">Entity ${program.current.entity} not found.</div>`;
            })}
          </nav>
        </header>
      </div>
      
      <div id="on_air">  
        ${this.programData.map(program => html`
          <section id="page">
            <aside class="side"><img src="/local/program_guide/loga_velka/${program.current.channelLogo}" @click="${ev => this._ch_switch(program.current.channel_id_tv)}"></aside>
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
              <div></div> 
              <div>  
                <div class="d1">
                  <div class="d2" style="width: ${this.calculateProgramWidth(program.current.Start, program.current.Stop)}%;"></div>      
                </div>  
              </div>
              <details>
                <summary>
                  <span>${program.next.startTime}</span>
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
            <img src="/local/icon/remote-tv_36.png"/> 
            <div class="remoteButtons">
              ${this.config.tv_control_method === 'webostv' ? html`
                <a href="#" title="Vypnout"><img src="/local/icon/power-off.png" style="width: 42px;opacity: 0.3;" @click="${ev => this._remote('EXIT')}" /> 
                <span class="timeStop" style="position: absolute; top: 12px; left: 7px; font-size: 14px;">EXIT</span>
                </a>
              ` : html`
                <a href="#" title="Vypnout"><img src="/local/icon/power-off.png" style="width: 42px;" @click="${ev => this._remote('POWER')}" /></a>
              `}
              <a href="#" title="Mute"><img src="/local/icon/volume_mute_2_36.png" style="width: 42px;" @click="${ev => this._remote('MUTE')}"/></a>
              <a href="#" title="Zvýšit hlasitost"><img src="/local/icon/volume_up_2_36.png" style="width: 42px; position: relative;" @click="${ev => this._remote('VOLUMEUP')}"/>
                <span class="timeStop" style="position: absolute; top: 12px; left: 7px; font-size: 14px; color: white;" @click="${ev => this._remote('VOLUMEUP')}">${this.calculateVolumeLevel()}</span>
              </a>
              <a href="#" title="Snížit hlasitost"><img src="/local/icon/volume_down_2_36.png" style="width: 42px; position: relative;" @click="${ev => this._remote('VOLUMEDOWN')}"/>
                <span class="timeStop" style="position: absolute; top: 12px; left: 7px; font-size: 14px; color: white;" @click="${ev => this._remote('VOLUMEDOWN')}">${this.calculateVolumeLevel()}</span>
              </a>
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
                <span class="time" @click="${ev => this._ch_switch(entry)}">${entry.startTime}</span><br>
                <span class="timeStop">${entry.stopTime}</span>
              </aside>
              <main>
                <details class="content">
                  <summary>
                    <span @click="${ev => this.handleClickOnDetails(entry.Start, entry.channel_id_tv)}" class="summary-title">${entry.Title}</span>
                  </summary>
                  <div class="summary-content">${entry.short_description}</div>
                  <div>
                    <p class="minutes">${entry.date}</p>
                    <p class="type">${entry.country}</p>
                    <p class="type">${entry.Category}</p>
                  </div>    
                </details>
                <div></div>
                <div>  
                  <div class="d1">
                    <div class="d2" style="width: ${this.calculateProgramWidth(entry.Start, entry.Stop)}%;"></div>      
                  </div>  
                </div>
              </main>
            </section>
          `)
        }
      </div>
    `;
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

  _toggleEpg() {
    let x = this.shadowRoot.getElementById("full_day");
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  }

  _toggleMenu() {
    let x = this.shadowRoot.getElementById("on_air");
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  }

  _ch_switch(id_tv) {
    if (!this._hass || !this._hass.callService || !this.config) return;
    this._hass.callService('webostv', 'button', {
      entity_id: this.config.entity_id,
      button: `num${id_tv}`
    });
  }

  _remote(command) {
    if (!this._hass || !this._hass.callService || !this.config) return;
    this._hass.callService('webostv', 'button', {
      entity_id: this.config.entity_id,
      button: command
    });
  }

  static get styles() {
    return css`
      .epg-container {
        display: flex;
        flex-direction: column;
        margin: 16px;
        padding: 16px;
        border-radius: 8px;
        background-color: var(--ha-card-background, var(--card-background-color, white));
        box-shadow: var(--ha-card-box-shadow, none);
      }
      .epg-container-header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
      .vertical-align-middle {
        vertical-align: middle;
      }
      .scroll {
        overflow-x: auto;
        white-space: nowrap;
      }
      .nav-item {
        display: inline-block;
        margin-right: 16px;
      }
      .nav-item img {
        cursor: pointer;
      }
      .remote {
        position: fixed;
        bottom: 16px;
        right: 16px;
        z-index: 100;
      }
      .remoteToggle {
        display: none;
      }
      .remoteButtons {
        display: none;
        flex-direction: column;
        gap: 8px;
      }
      .remoteToggle:checked + img + .remoteButtons {
        display: flex;
      }
      .remoteButtons img {
        cursor: pointer;
      }
      #page {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        padding: 16px 0;
      }
      #page_full {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        padding: 16px 0;
      }
      .side {
        margin-right: 16px;
      }
      .side img {
        cursor: pointer;
      }
      .side .time, .side .timeStop {
        display: block;
        text-align: center;
        margin: 8px 0;
      }
      .content {
        display: block;
        margin-bottom: 16px;
      }
      .content summary {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 16px;
        cursor: pointer;
      }
      .summary-title {
        cursor: pointer;
        font-weight: bold;
      }
      .summary-content {
        margin: 8px 0;
      }
      .minutes, .type {
        margin: 4px 0;
      }
      .d1 {
        display: flex;
        width: 100%;
        background-color: var(--primary-color, lightgray);
      }
      .d2 {
        height: 8px;
        background-color: var(--secondary-color, gray);
      }
    `;
  }
}

customElements.define('program-guide-card', ProgramGuideCard);
