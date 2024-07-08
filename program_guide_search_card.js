import {
    LitElement,
    html,
    css
  } from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";
  
  class ProgramGuideSearchCard extends LitElement {
    static get properties() {
      return {
        hass: { type: Object },
        entities: { type: Array },
        includeHelper: { type: String },
        excludeHelper: { type: String },
        entityData: { type: Array }
      };
    }
  
    constructor() {
      super();
      
     
      this.includeHelper = '';
      this.excludeHelper = '';
      this.entityData = [];
    }
  
   setConfig(config) {
      if (!config.entities ) {
        throw new Error("You need to define an entity");
      }
      this.config = config;
   
    }
    
      static get styles() {
      return css`
      
      .container-example-two {
      position: sticky;
      top: 55px;
      margin-bottom: 4px;
      border: 2px solid;
      -webkit-box-shadow: 0 8px 6px -6px black;
      -moz-box-shadow: 0 8px 6px -6px black;
      box-shadow: 0 8px 6px -6px black;
  }
  
  .example-two-header {
      overflow: hidden;
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
  
  body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
      max-width: 492px;
      margin: 10vmin auto 0;
      color: #64cce3;
      line-height: 1.5;
  }
   
   
        #page {
          display: grid;
          width: 100%;
          border: 1px solid;
          background: #e5e6e6;
          margin-bottom: 4px;
          grid-template-areas:"head head"
                              "aside  main";
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
          border: 1px solid rgba(0,0,0,0.05);
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
        img {
          display: inline-block;
          margin: auto;
          max-width: 90px;
        }
        .time {
          color: red;
          height: 100%;
        }
        details {
          margin: 10px auto;
          background: #ffffff;
          text-overflow: ellipsis;
          background: #e5e6e6;
        }
        details .summary-title {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          margin-left: 0px;
          color: black;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 1.3em;
        }
        details .summary-content {
          border-top: 1px solid #e2e8f0;
          cursor: default;
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
          background-color: #d80001;
        }
       
    }
  
      
      
     
      `;
      }
  set hass(hass) {
       this._hass = hass;
      
   
  
      const includeQueries = this._hass.states[this.config.include_helper].state.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(',').map(query => query.trim());
      const excludeQueries = this._hass.states[this.config.exclude_helper].state.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(',').map(query => query.trim());
  
      if (!includeQueries.some(query => query)) {
          // Pokud je input pro hledání prázdný nebo se stane prázdným, nevyhledávají se žádná data
          this.entityData = [];
      } else {
          const allSensorData = [];
  
          this.config.entities.forEach(entity => {
              const sensorState = this._hass.states[entity];
              if (sensorState && sensorState.attributes && sensorState.attributes.data) {
                  const sensorData = sensorState.attributes.data;
                  allSensorData.push(...sensorData);
              }
          });
  
          if (!excludeQueries.some(query => query)) {
              // Pokud je input pro vyloučení prázdný nebo se stane prázdným, načtou se data bez vyloučení
              this.entityData = allSensorData.filter(entry => 
                  includeQueries.some(query => 
                      (entry.Title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query) || 
                      (entry.short_description && entry.short_description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query))) &&
                      new Date(entry.Stop) > new Date()
                  )
              );
          } else {
              // Provést filtrování s vyloučením
              this.entityData = allSensorData.filter(entry => 
                  includeQueries.some(query => 
                      (entry.Title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query) || 
                      (entry.short_description && entry.short_description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query))) &&
                      !excludeQueries.some(excludeQuery => 
                          (entry.Title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(excludeQuery) || 
                          (entry.short_description && entry.short_description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(excludeQuery)))
                      ) &&
                      new Date(entry.Stop) > new Date()
                  )
              );
          }
      }
  
      //console.log('Filtered entities:', this.entityData); 26,3-6,16
  
   
  }
  
    handleClickOnDetails() {
      // close all details
      let details = this.shadowRoot.querySelectorAll("details");
    
      details.forEach((targetDetail) => {
        targetDetail.addEventListener("click", () => {
          // Close all the details that are not targetDetail.
          details.forEach((detail) => {
            if (detail !== targetDetail) {
              detail.removeAttribute("open");
            }
          });
        });
      });
    
     
    }
    
  render() {
    return html`
      <link rel="stylesheet" type="text/css" href="/local/scripts/ane.css" />
  
      <div class="movie_list" id="movies_list">
        ${this.entityData.map((i, index) => html`
          <section id="page">
            <aside class="side"><img src="/local/program_guide/loga_velka/${i.channelLogo}"  ></aside>
            <main>
              <details class="content">
                <summary>
                  <span @click="${ev => this.handleClickOnDetails()}" class="summary-title">${i.Title}</span> 
                  <br>
                  <span class=" ">${i.startDatum}         ${i.startTime} -  ${i.stopTime}</span>
                  <div class="summary-content">${i.short_description}</div>
                </summary>
              </details>
            </main>
          </section>
        `)}
      </div>
    `;
  }
  
  
  }
  
  customElements.define("program-guide-search-card", ProgramGuideSearchCard);
  