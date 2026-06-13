---
title: Markdown cheat sheet
description: Liste des fonctionnalité de mises en forme et des composants du markdown convertis de Obsidian à Astro.
date: 2025-07-06
---
J'ai fait le choix d'écrire tous mes articles avec [Obsidian](https://obsidian.md/), un éditeur de fichiers au format markdown (.md). Mon blog étant mis en ligne avec [Astro](https://astro.build/), certaines fonctionnalités d'Obsidian ne se transposent pas correctement de façon native. Le but étant d'avoir un workflow simple de bout en bout, j'ai dû me résoudre à écrire quelques bouts de code afin de faire la conversion de l'un à l'autre de manière automatique.

Cette page est simplement une référence qui liste toutes les fonctionnalités de mise en page dans le but de tester le bon affichage des articles par la suite.

# Textes
Ceci est un paragraphe.
Ceci est un autre paragraphe.

Ceci est un dernier paragraphe.

# Ceci est un titre n°1
## Ceci est un titre n°2
### Ceci est un titre n°3
#### Ceci est un titre n°4
##### Ceci est un titre n°5
###### Ceci est un titre n°6

---
# Formatage
**Texte en gras**

_Texte en italique_

~~Texte barré~~

==Texte surligné==

**Texte en gras avec une partie _en italique_**

***Texte en gras ET en italique***

---
# Liens
[[Classification du savoir et des recettes en pâtisserie|Lien interne]] _(ne fonctionne pas pour le moment)_

[Lien vers un site extérieur](https://google.com)

# Images
![](https://history-computer.com/ModernComputer/Basis/images/Engelbart.jpg)
>Photo de **Douglas Carl Engelbart**, importée depuis une source externe.

![[a248daeefd9da37e76b3c2d47139374f_MD5.jpg|600x200]]
>Photo de **Douglas Carl Engelbart**, importée localement et redimensionnée.

# Callouts
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.
_\- Doug Engelbart, 1961_

> [!info]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

> [!note]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

> [!abstract]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

> [!todo]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

> [!tip]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

> [!success]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

> [!question]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

> [!warning]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

> [!failure]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

> [!danger]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

> [!bug]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

> [!example]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

> [!quote]
> Human beings face ever more complex and urgent problems, and their effectiveness in dealing with these problems is a matter that is critical to the stability and continued progress of society.

# Listes
- Premier item
- Deuxième item
- Troisième item

1. Premier item
2. Deuxième item
3. Troisième item

- [x] Tâche complétée.
- [ ] Tâche incomplète.

- [x] Task item 1
	- [ ] Subtask 1
- [ ] Task item 2
	- [x] Subtask 1

# Code
Le texte placé entre des `backticks` dans une ligne sera formaté comme du code.

Trois `backticks` forment un bloc de code
```
cd ~/Desktop
```

Trois `backticks` suivis du langage permettent d'activer la _color syntax_
```js
function fancyAlert(arg) {
  if(arg) {
    $.facebox({div:'#foo'})
  }
}
```

# Footnotes

Lorem ipsum dolor sit amet. [^1]

Double référence dans un texte.[^2][^3]

[^1]: Ceci est une _footnote_.
[^2]: Les _footnotes_ sont des "références", une sorte de note de bas de page. 
[^3]: Elles sont utiles pour ajouter une source, une info complémentaire ou du contexte.

# Caractères spéciaux
\*Les caractères précédés d'un "\\" ne seront pas utilisés pour formater le texte\*

# Tableaux

| First name | Last name |
| ---------- | --------- |
| Max        | Planck    |
| Marie      | Curie     |
| Albert     | Einstein  |

# Latex

$$
\begin{vmatrix}a & b\\
c & d
\end{vmatrix}=ad-bc
$$

Ceci est une expression mathématique ==inline== $e^{2i\pi} = 1$.

