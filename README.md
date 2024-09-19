# TV Program karta

Tato vlastní karta zobrazuje interaktivní televizní program v Home Assistant. Umožňuje uživatelům prohlížet aktuální a nadcházející pořady přímo na ovládacím panelu.

Funkce:

Zobrazení denního televizního programu pro vybrané kanály
Podpora více kanálů
Přehledné a uživatelsky přívětivé rozhraní
Možnost přizpůsobení vzhledu a rozložení
## Instalace

### Pomocí HACS

- Přidejte toto úložiště jako vlastní úložiště integrace a poté restartujte domácího asistenta
- V části Nastavení, zařízení a služby přidejte integraci a vyhledejte „Tv-Program“
 

### Ručně

- Stáhněte si repo a zkopírujte do adresáře www/epg_custom_card



Stáhněte si soubor tv-program-card.js a umístěte ho do složky www/epg_custom_card
Přidejte kartu do souboru ui-lovelace.yaml:
```yaml
resources:
  - url: /local/tv-program-card.js
    type: module
    ```
#Nakonfigurujte kartu ve svém ovládacím panelu Lovelace:
```yaml
type: 'custom:tv-program-card'
entity: sensor.tv_program
```
Požadavky:

EPG senzor poskytující data televizního programu
Poznámky: Tato karta je navržena tak, aby fungovala s daty z integrace *[Tv-Program](https://github.com/jerod33/Tv-Program)*
 
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