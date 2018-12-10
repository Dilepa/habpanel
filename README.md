# HabPanel config

HabPanel config for Openhab2

## Usage

every block must have an lazy load instruction
```
<div class="custom full-height setting" oc-lazy-load="['/static/habpanel/jquery-3.2.1.min.js','/static/habpanel/custom.js']">
```
followed by:
```
<md-load/>
```
followed by an section:
```
<div class="title">
  <h1>Einstellungen</h1>
  <div class="icon">
    <div>
      <svg viewBox="0 0 48 48">
        <use xlink:href="/static/habpanel/svg/section.svg#setting"></use>
      </svg>
    </div>
  </div>    
</div>
```
maybe followed by an block:
```
<div class="block">
  <div class="widget one-column">
    <div class="name">Jahreszeit:</div>
    <div class="value">
      <md-select ng-width="100" ng-item-name="itemSceneSeason">
        <md-option ng-value="1">Frühling</md-option>
        <md-option ng-value="2">Sommer</md-option>
        <md-option ng-value="3">Herbst</md-option>
        <md-option ng-value="4">Winter</md-option>
      </md-select>
    </div>
  </div>
</div>
```

## Example

Dropdown (default)

![alt text](https://raw.githubusercontent.com/dawys/habpanel/master/screenshots/dropdown-default.png)
```
<md-select ng-width="100" ng-item-name="itemSeason">
  <md-option ng-value="1">Frühling</md-option>
  <md-option ng-value="2">Sommer</md-option>
  <md-option ng-value="3">Herbst</md-option>
  <md-option ng-value="4">Winter</md-option>
</md-select>
```

Dropdown (date)

![alt text](https://raw.githubusercontent.com/dawys/habpanel/master/screenshots/dropdown-date.png)
```
<md-select ng-style="date" ng-item-name="itemDate"></md-select>
```

Dropdown (time)

![alt text](https://raw.githubusercontent.com/dawys/habpanel/master/screenshots/dropdown-time.png)
```
<md-select ng-style="time" ng-item-name="itemTime"></md-select>
```

Dropdown (temperature)

![alt text](https://raw.githubusercontent.com/dawys/habpanel/master/screenshots/dropdown-temperature.png)
```
<md-select ng-style="temperature" ng-width="80" ng-item-name="itemTemperature"></md-select>
```

Dropdown (light)

![alt text](https://raw.githubusercontent.com/dawys/habpanel/master/screenshots/dropdown-light.png)
```
<md-select ng-style="light" ng-item-name="itemLight"></md-select>
```

Dropdown (volume)

![alt text](https://raw.githubusercontent.com/dawys/habpanel/master/screenshots/dropdown-volume.png)
```
<md-select ng-style="volume" ng-item-name="itemVolume"></md-select>
```

Tabs

![alt text](https://raw.githubusercontent.com/dawys/habpanel/master/screenshots/tabs.png)
```
<md-tabs ng-model="heatingTypeIndex" ng-change="setHeatingType(heatingTypeIndex)">
  <md-pane ng-repeat="(name, title) in heatingTypes">
    {{title}}
  </md-pane>
</md-tabs>
```

Block rollershutter

![alt text](https://raw.githubusercontent.com/dawys/habpanel/master/screenshots/block-rollershutter.png)
```
<div class="custom full-height rollershutter" oc-lazy-load="['/static/habpanel/custom.css','/static/habpanel/jquery-3.2.1.min.js','/static/habpanel/custom.js']">
  
  <div class="section" ng-controller="rollershutter as vm">
    <div class="title">
      <h1>
        {{ngModel.name}}
      	<div class="uninitialized" ng-class="{'active':itemState(config.rollerShutterItemName) === 'NULL'}">
          <svg viewBox="0 0 48 48">
            <use xlink:href="/static/habpanel/svg/icons.svg#warning"></use>
          </svg>
        </div>
      </h1>
      <div class="icon">
        <div>
          <svg viewBox="-16 0 48 48">
            <use xlink:href="/static/habpanel/svg/icons.svg#heating"></use>
          </svg>
        </div>
      </div>
    </div>
    <div class="block">
      <div class="widget two-columns">
        <h2>Position:</h2>
        <div class="position">
          <span ng-repeat="n in [1,2,3,4,5,6,7,8,9,10,11,12]" class="lamella"></span>
          <span class="suspension"></span>
          <span class="suspension"></span>
        </div>
        <md-button-group ng-model="vm.rollerShutterPosition" ng-values="[0, 25, 50, 75, 100]" ng-change="setPosition()">
          <md-button>offen</md-button>
          <md-button>25%</md-button>
          <md-button>50%</md-button>
          <md-button>75%</md-button>
          <md-button>100%</md-button>
        </md-button-group>
      </div>
      <div class="widget two-columns">
        <h2>Ausrichtung:</h2>
        <div class="alignment">
          <span ng-repeat="n in [1,2,3]" class="lamella"></span>
          <span class="suspension"></span>
        </div>
        <md-button-group ng-model="vm.rollerShutterAlignment" ng-values="['ON', 'OFF']" ng-change="setAlignment()">
          <md-button>offen</md-button>
          <md-button>blickdicht</md-button>
        </md-button-group>
      </div>
    </div>
  </div>
</div>
```
