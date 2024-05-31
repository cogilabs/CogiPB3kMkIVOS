# Cogilabs Pip-Boy 3000 Mk4
[→ En Français](/localizedReadme/README-fr.md)

<p align="center">
    <!--<img alt="Banner" title="Banner" src="/readme_sources/images/banner.png">-->
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
  - [Other](#other)
- [The physical Pip-Boy](#the-physical-pip-boy)
  - [The wiring](#the-wiring)
  - [The 3D model](#the-3d-model)

## Introduction

The project is really in two parts:

- The "OS", which I'm remaking from scratch in Electron. It will be mostly functionnal.
- The object itself, which will be a Raspberry Pi 3B+ encased in a 3D printed Pip-Boy, I will modify a model from the internet which will be credited here later.

For the moment I'm waiting for the delivery of my components, so I'm working on the App.  

## The application
  
![The Status page](/readme_sources/images/status.png)  
  
The app is mostly a reproduction of Fallout 4 interface, for the content, there's profile files. 

### Profile file
  
Inside your profile file are your:
  
- Nickname  
→ It will be displayed on the Status page.  
  
- Interface color  
→ The color of the screen is customisable in the settings tab. You can store your color in your profile file.  
  
- Birthdate  
→ It will be used to calculate your level, the level itself being your age and the experience bar showing what's left before your next birthday.  
  
- Inventory  
→ All your items will be stored there for display in the inventory tab.  
  
- Special points and perks  
→ Like the inventory, they will be stored there for display in the status tab.  
  
Three profile files are hardcoded:  
  
- The Guest profile which is default FO4 green, has standard items and perks, born 01/01/2000, and *doesn't display a name on the status page* (Useful to let your friends try it without your name on it)  
- My own profile, displaying "David", being yellow and of course custom inventory and perks.  
- My fiancee profile, displaying "Marie" and being pink and also with custom inventory and perks.  

You can load them using the settings tab (the empty space on the left of the STAT tab, or press "P" on your keyboard).  

Then there's *your* profile. 
If a profile file named `local.json` is placed in `<home folder>/pipBoy/`, it will be automatically loaded on Pip-Boy start. If it exists, a "Local" button is added to the settings tab to load it again if changed for another.  
If it doesn't exist, the "Demo mode" is loaded, loading the Guest profile but displaying "DEMO MODE" in the username spot on the status page.  
  
Use [`guest.json`](/profiles/guest.json) and [`items.json`](/items.json) to create your own `local.json` file.  
  
The [`items.json`](/items.json) file stores every existing inventory item and perk, so their data is not repeated in every profile file.

### Color customisation

On the left of the tabs is a "secret" tab, it's not visible to not uglify the interface and will have a dedicated physical button.  
This tab allows you to customize the color of your Pip-Boy's screen.  
To make the customisation easier, I opted for HSL selection: Hue, Saturation and Lightness.  
  
![The Settings page](/readme_sources/images/settings.png)  
  
You'll find four sliders:  
  
- Hue  
→ The hue is essentially the tint, represented by the angle on a chromatic circle from 0 (Red) to 360 (Red also since it's a full rotation). 120 is the FO4 Pip-Boy tint.  
  
- Saturation  
→ Is how "powerfull" is your color, from 0 (black and white) to 100 (Really colorful).  
  
- Brightness  
→ Represents how bright is your color, because of issues with CSS and image filters, it modifies the brightness *or* the lightness depending on the element it modifies. Values above 60 will not work as intended since lightness kind of also affects saturation.  
  
- Icon brightness correction  
→ Since there is know problem with how CSS rotates Hue, also affecting saturation and brightness, I added this slider that helps greatly correcting the difference between text and icons. A square under the slider helps setting this value correctly: The text "You must not see this text" written inside it must not be visible, or at least as little as possible.
  
![Correction not set](/readme_sources/images/iconCorrection1.PNG) ![Correction set](/readme_sources/images/iconCorrection2.PNG)  
  
This settings page allows for neat configs like for instance my fiancees:  
    
![Pink Status page](/readme_sources/images/pinkStatus.png)

### Inventory display

In the inventory tab will be shown your inventory (set in your profile file).  
  
![Inv/Weapons](/readme_sources/images/weapons.png)  
   
![Inv/Apparel](/readme_sources/images/apparel.png)  
   
![Inv/aid](/readme_sources/images/aid.png)  
   
The stats of the items (in the table) come from the [`items.json`](/items.json) file, except for the amount of ammo, which comes from your profile file.  
  
For the moment the equipped state is static (makes sense for a cosplay) and are set in the profile file.
  
The footers are interactive, the weight is calculated in function of your current inventory. The weapons tab footer will show the damage of your equipped weapon (only shows 10mm for now), the apparel tab footer show armor protection, and the aid one your HP bar.  
  
### Map

For the Map, since it's mostly for cosplays during conventions, it shows a heavily edited version of an image (for now images/nim.png).  
I plan to load the map of the convention I'm going before going to one, to have the local map.  
  
I tested with a low-resolution version of the map of my city's last year local convention, just to see. The CSS filters work great to make a "Pip-Boyified" map with any image:  
  
![Map](/readme_sources/images/map.png)  
  
I might add a "world" version where a upload a city map with a fake position arrow on the building where the convention happens.

### Radio

The Pip-Boy is equipped with a "working" radio. It's not in any way an AM/FM radio, I want it to be the most roleplay possible. It uses .mp3 files you put is the musics folder.  
  
When the Pip-Boy starts, it creates a randomised playlist of all the songs, then takes the first one and plays it *silently* starting at 30 seconds in the song.  
  
In the Radio tab, I put the games radios as "unreachable" and my own radio as the only working one. When you activate it, the sound level goes up, essentially "turning on" the radio. If you deactivate it, it turns the sound off again, but *never pauses the music*. That and the fact it starts at 30 seconds in the song, make it feel like a radio. OF course the radio stays activated if you leave the tab.
  
For the graph, it's randomly generated on tab loading, then just loops, I plan to try to smooth it more in the future.  
  
For my Pip-Boy I added most songs from Fallout 4 and Fallout 76, which I will of course not distribute here. I do recommend putting in Fallout songs, but you can of course put whatever you want in that folder.  
  
![Radio](/readme_sources/images/radio.png) 

### Other

For the Data and Map tabs, the footer gives the date and time, so the Pip-Boy could even be used as a watch:  
![Data/Quests](/readme_sources/images/quests.png)  

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