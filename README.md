# TV Program karta

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg?style=for-the-badge)] 

Tato vlastní karta zobrazuje interaktivní televizní program v Home Assistant. Umožňuje uživatelům prohlížet aktuální a nadcházející pořady přímo na ovládacím panelu.

## Funkce:
- Zobrazuje pro všechny zvolené stanice aktuální a nadcházející pořady
- Umožňuje zobrazit podrobný program pro vybranou TV stanici od současného času do konce dne
- Možnost přepínat na zvolenou stanici kliknutím na logo (funguje pouze pro LG webOS a Remote)
- Dálkový ovladač pro LG webOS


## Instalace

### Pomocí HACS

- Přidejte toto úložiště jako vlastní úložiště integrace a poté restartujte domácího asistenta
- V části Nastavení, zařízení a služby přidejte integraci a vyhledejte „televizní průvodce“
 

### Ručně

- Stáhněte si soubor tv-program-card.js a umístěte ho do složky www/epg_custom_card

Ujistěte se, že jste tuto kartu přidali do správy zdrojů [Lovelace ](https://my.home-assistant.io/redirect/lovelace_resources/)
```yaml
resources:
  - url: /local/epg_custom_card/program_guide_card.js
    type: module
 ```
Restartujte Home Assistant. 

## Použití

Jakmile je zdroj přidán, můžete konfigurovat kartu ve svém Lovelace rozhraní. Použijte následující YAML konfiguraci pro přidání karty:

```yaml
    type: custom:program-guide-card
    epg_today: sensor.epg_sensor_day_0
    epg_yesterday: sensor.epg_sensor_yesterday
    show_remote: true
    entity_id: media_player.living_room_tv_2
    tv_control_method: webostv
    channel_info:
      - name: ČT2
        tv_channel_number: '7_41_20_0_3212_14052_3'
    ```

### Konfigurační možnosti

- **`type`**: (Povinné) Musí být `custom:program-guide-card` pro načtení vlastní karty.
- **`epg_today`**: (Povinné) Musí být `sensor.epg_sensor_day_0`.
- **`epg_yesterday`**: (Povinné) Musí být `sensor.epg_sensor_yesterday`.
- **`entity_id`**: (Povinné pokud chceme ovládat tv) Sensor tv, která má byt ovládána (LG webOS ,  Remote)`.
- **`show_remote`**: (Volitelné) Zobrazí dalkové ovládání tv, defaultně je false.
- **`tv_control_method`**: (Povinné pokud chceme ovládat tv) lgwebos nebo ??.
- **`channels`**: (Povinné) Seznam TV kanálů. Každý kanál vyžaduje:
  - **`id`**: (Povinné) ID kanálu.
  - **`name`**: (Povinné) Zobrazovaný název kanálu.
  - **`tv_channel_number:`**: (Povinné pokud chceme ovládat tv) Číslo kanálu v tv u remote, u lg webos je to channelId. Musí být string.

### Příklad

Zde je příklad, jak použít vlastní kartu v Lovelace pro LG WebOS:

    ```yaml
    type: custom:program-guide-card
    epg_today: sensor.epg_sensor_day_0
    epg_yesterday: sensor.epg_sensor_yesterday
    show_remote: true
    entity_id: media_player.living_room_tv_2
    tv_control_method: webostv
    channel_info:
      - name: ČT
        tv_channel_number: '7_41_20_0_3212_14052_3'
      - name: ČT2
        tv_channel_number: '7_41_20_0_3212_14052_4'  
    ```
 
 
##Požadavky:

EPG senzor poskytující data televizního programu. Tato karta je navržena tak, aby fungovala s daty z integrace *[Tv-Program](https://github.com/jerod33/Tv-Program)*
 
>.......

{% set data = namespace(available_channels=[]) %}
{% for channel in state_attr('sensor.epg_sensor_yesterday', 'data') %}
  {% if channel.channel_name not in data.available_channels %}
    {% set data.available_channels = data.available_channels + [channel.channel_name] %}
  {% endif %}
{% endfor %}
{%- for name in data.available_channels %}
- name: {{ name }}
  tv_channel_number: null
{%- endfor %}