# Cogilabs Pip-Boy 3000 Mk4
[→ En Français](/localizedReadme/README-fr.md)

<p align="center">
    <img alt="Banner" title="Banner" src="https://raw.githubusercontent.com/cogilabs/CogiPB3kMkIVOS/refs/heads/main/readme_sources/images/banner.png?raw=true">
</p>
<p align="center">
    <a href="https://electronjs.org/" target="_blank"><img alt="Electron badge" title="Built with Electron!" src="https://img.shields.io/badge/Electron-4E44B6?style=for-the-badge&logo=electron&logoColor=white"/></a>
</p>

## ⚠️ Warning: Work in Progress ⚠️

The **Cogilabs Pip-Boy 3000 Mk4** is a version of Fallout 4's Pip-Boy I'm making for cosplay purposes.  

## Table of Contents

- [Introduction](#introduction)
- [The application](#the-application)
  - [Profile file](#profile-file)
  - [Color customisation](#color-customisation)
  - [Inventory display](#inventory-display)
  - [Map](#map)
  - [Radio](#radio)
  - [Status](#status)
  - [Quests](#quests)
  - [Other](#other)
- [The physical Pip-Boy](#the-physical-pip-boy)
  - [The wiring](#the-wiring)
  - [The 3D model](#the-3d-model)
- [Licensing & Credits](#licensing--credits)

## Introduction

The project is really in two parts:

- The "OS", which I'm remaking from scratch in Electron. It will be mostly functionnal.
- The object itself, which will be a Raspberry Pi 3B+ encased in a 3D printed Pip-Boy, I will modify a model from the internet which will be credited here later.

For the moment I'm waiting for the delivery of my components, so I'm working on the App.  

## The application
  
![The Status page](/readme_sources/images/status.png)  
  
The app is mostly a reproduction of Fallout 4 interface, with a pretty cool animated scanlines overlay and "glitch" animations. For the content, there's profile files. 

### Profile file
  
Inside your profile file are your:
  
- Nickname  
→ It will be displayed on the Status page.  
  
- Interface color  
→ The color of the screen is customisable in the settings tab. You can store your color in your profile file.  
  
- Birthdate  
→ It will be used to calculate your level, the level itself being your age and the experience bar showing what's left before your next birthday.  
  
- Inventory  
→ All your items and caps will be stored there for display in the inventory tab.  
  
- Special points and perks  
→ Like the inventory, they will be stored there to be used in max health and max carry capacity calculation and for display in the status tab.  
  
- Health  
→ You individual limbs health points can be set and will be used to calculate your current health points.  
  
- Quests  
→ You can have your own quests for display in the data tab.  
  
For the moment, three profile files are hardcoded:  
  
- The Guest profile which is default FO4 green, has standard items and perks, born 01/01/2000, and *doesn't display a name on the status page* (Useful to let your friends try it without your name on it)  
- My own profile, displaying "David", being yellow and of course custom inventory and perks.  
- My fiancee profile, displaying "Marie" and being pink and also with custom inventory and perks.  

You can load them using the settings tab (the empty space on the left of the STAT tab, or press "P" on your keyboard).  

Then there's *your* profile. 
If a profile file named `local.json` is placed in `<home folder>/pipBoy/`, it will be automatically loaded on Pip-Boy start. If it exists, a "Local" button is added to the settings tab to load it again if changed for another.  
If it doesn't exist, the "Demo mode" is loaded, loading the Guest profile but displaying "DEMO MODE" in the username spot on the status page.  

**New!** There is a work in progress ***profile creator*** available [here](https://cogilabs.eu/pipBoyProfileCreator/).  
I recommend using it to create your profile file.  
  
But if you don't want to, you can use [`guest.json`](/profiles/guest.json) and [`items.json`](/items.json) to create your own `local.json` file.  
  
The [`items.json`](/items.json) file stores every existing inventory item and perk, so their data is not repeated in every profile file.

### Color customisation

On the left of the tabs is a "secret" tab, it's not visible to not uglify the interface and will have a dedicated physical button.  
This tab allows you to customize the color of your Pip-Boy's screen.  
To make the customisation easier, I opted for HSL selection: Hue, Saturation and Lightness.  
  
![The Settings page](/readme_sources/images/settings.png)  
  
You'll find three sliders:  
  
- Hue  
→ The hue is essentially the tint, represented by the angle on a chromatic circle from 0 (Red) to 360 (Red also since it's a full rotation). 120 is the FO4 Pip-Boy tint.  
  
- Saturation  
→ Is how "powerfull" is your color, from 0 (black and white) to 100 (Really colorful).  
  
- Lightness  
→ Represents how "bright" is your color, not to be confused with *brightness*, values of lightness above 60 also affect the saturation.  
  
This settings page allows for neat configs like for instance my fiancees:  
    
![Pink Status page](/readme_sources/images/pinkStatus.png)

### Inventory display

In the inventory tab will be shown your inventory (set in your profile file).  
  
![Inv/Weapons](/readme_sources/images/weapons.png)  
   
![Inv/Apparel](/readme_sources/images/apparel.png)  
   
![Inv/aid](/readme_sources/images/aid.png)  
  
![Inv/junk](/readme_sources/images/junk.png)  
   
The stats of the items (in the table) come from the [`items.json`](/items.json) file, except for the amount of ammo, which comes from your profile file.  
  
For the moment the equipped state is static (makes sense for a cosplay) and is set in the profile file.
  
The footers are interactive, the weight is calculated in function of your current inventory. The weapons tab footer will show the damage of your equipped weapon, the apparel tab footer show armor protection, and the aid one your HP bar.  
  
The icons on the Status page are also interactive and also show the damage and armor protection values.
  
### Map

For the Map, since it's mostly for cosplays during conventions, it shows a heavily edited version of an image (for now images/nim.png).  
I plan to load the map of the convention I'm going before going to one, to have the local map.  
  
I tested with a low-resolution version of the map of my city's last year local convention, just to see. The CSS filters work great to make a "Pip-Boyified" map with any image:  
  
![Map](/readme_sources/images/map.png)  
  
I might add a "world" version where a upload a city map with a fake position arrow on the building where the convention happens.

### Radio

The Pip-Boy is equipped with a "working" radio. It's not in any way an AM/FM radio, I want it to be the most roleplay possible. It uses .mp3 files you put in the musics folder.  
  
When the Pip-Boy starts, it creates a randomised playlist of all the songs, then takes the first one and plays it *silently* starting at 30 seconds in the song.  
  
In the Radio tab, I put the games radios as "unreachable" and my own radio as the only working one. When you activate it, the sound level goes up, essentially "turning on" the radio. If you deactivate it, it turns the sound off again, but *never pauses the music*. That and the fact it starts at 30 seconds in the song, make it feel like a radio. OF course the radio stays activated if you leave the tab.
  
For the graph, it used to be randomly generated on tab loading, but I didn't like the result, so I ended up just generating sinewaves with varying heights.  
  
For my Pip-Boy I added most songs from Fallout 4 and Fallout 76, which I will of course not distribute here. I do recommend putting in Fallout songs, but you can of course put whatever you want in that folder.  
  
![Radio](/readme_sources/images/radio.png) 
  
Since some friends want to join me when I'll be finished with this project, I'm currently working on a way to synchronize the radio between several Pip-Boys.

### Status

In the Status tab, along with the main page, the S.P.E.C.I.A.L attributes and perks are also available.
Along with the customisation of attributes ranks in the profile file, you can also equip any of the perks present in Fallout 4.

The SPECIAL tab will show every attribute, with their rank, their animated picture and description.

The perks tab will show any of the perks present in the profile file, with their animated picture, selected rank (shown in stars), and the description *that corresponds to that rank*.

![Attributes](/readme_sources/images/attributes.png)

![Perks](/readme_sources/images/perks.png)

### Quests

The user can set quests in their profile file via the [profile creator tool](https://cogilabs.eu/pipBoyProfileCreator/).
Those quests are displayed in the order they are declared in the file, except of course for those that are completed, they appear under the non-completed ones.  

![Data/Quests](/readme_sources/images/quests.png)  

### Other

For the Data and Map tabs, the footer gives the date and time, so the Pip-Boy could even be used as a watch, see screenshots above.

## The physical Pip-Boy

The physical part of the Pip-Boy is made of:  
(everything here is subject to change)  
  
- 1 Raspberry 3B+ with 1Gb RAM and Raspbian installed
- 1 5 inches touchscreen
- 1 Powerboost 1000C
- 1 6600 mAh battery
- 2 rotary encoders
- 1 potentiometer
- 2 LEDs
- 1 physical button
- The 3D model

### The wiring

[WIP]

### The 3D model

[WIP]

#### Modifications to the model

[WIP]

---

## Licensing & Credits

This project combines original work and fan-made content.

- The **code** is released under the [MIT License](/LICENSE.md).
- The **UI icons**, **interface visuals**, and other **original assets** are licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
- The **modified 3D model** is shared under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), based on the *Pip-Boy 3000 Mark IV* by Ytec3D.
- The **Roboto** font is used under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
- **Fallout-related content** (Vault Boy, perks, item images, etc.) is © Bethesda Softworks / ZeniMax Media and used here under *fair use* for a non-commercial fan project.

For full details, please refer to:
- [LICENSE.md](/LICENSE.md) - MIT license for the code  
- [LICENSES.md](/LICENSES.md) - summary of all licenses  
- [ATTRIBUTIONS.md](/ATTRIBUTIONS.md) - detailed credits and sources
