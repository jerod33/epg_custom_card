# TV Program karta


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

nebo :

{% set epg_data = state_attr('sensor.epg_sensor_yesterday', 'data') %}
{% set data = namespace(available_channels=[]) %}
{% for channel in epg_data %}
  {% if channel.channel_name not in data.available_channels %}
    {% set data.available_channels = data.available_channels + [channel.channel_name] %}
  {% endif %}
{% endfor %}
{{ data.available_channels }}

nebo : 


{% set data = namespace(available_channels=[]) %}
{% for channel in state_attr('sensor.epg_sensor_yesterday', 'data') %}
  {% if channel.channel_name not in data.available_channels %}
    {% set data.available_channels = data.available_channels + [channel.channel_name] %}
  {% endif %}
{% endfor %}
{{ data.available_channels }}


pro inspiraci : 

https://github.com/jcwillox/lovelace-paper-buttons-row/blob/main/README.md?plain=1
In your ui-lovelace.yaml add this:
```yaml
  - url: /community_plugin/dual-gauge-card/dual-gauge-card.js
    type: js
```


