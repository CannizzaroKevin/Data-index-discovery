# Data-index-discovery
# Les index

<p class="fragment">Et pas <em>indexes</em></p>
<p class="fragment">qui est le pluriel anglais</p>
<p class="fragment">ou la deuxième personne du singulier de l'indicatif présent du verbe <em>indexer</em></p>

---

# Le constat

Sur des tables à fort volume, les opérations récurrentes (parcours, filtrage, calcul) peuvent devenir lentes.

<p class="fragment">Plutôt que de chercher tout de suite à redimensionner l'infrastructure, on peut déjà chercher la cause</p>

--

## Exemple

`SELECT * FROM table WHERE age = $1`

| Nb lignes | Tps réponse |
| ---------|------------- |
| 1000 | < 1ms |
| 10k | 10ms |
| 100k | 300ms |
| 1M | 15s |
| 10M | prévoyez un bouquin |

--

## La non-linéarité

Même pour un `SELECT` sans filtre, l'évolution du temps de réponse n'est pas linéaire.

<ul>
    <li class="fragment">Plus de lignes à retenir = plus de mémoire mobilisée</li>
    <li class="fragment">Les opérations nécessitent parfois plusieurs fois plusieurs passes sur les données</li>
    <li class="fragment">Plus de données stockées = plus de risque de segmentation sur le disque</li>
</ul>

<p class="fragment">=> Comment qu'on fait, alors ?</p>

--

## On anticipe

Ce n'est pas parce qu'une table existe qu'elle va nécessairement être utilisée pour des calculs complexes ou des filtres avancés.

<p class="fragment">Une table <code>user</code>, par exemple, sera certainement parcourue toujours de la même manière :</p>

<ul>
    <li class="fragment">En filtrant sur le pseudo ou l'email lors de la connexion</li>
    <li class="fragment">En filtrant sur l'id lors de l'affichage du profil</li>
</ul>

<p class="fragment">En anticipant les usages d'une table, on peut mettre en place des index pour garantir une rapidité fulgurante même à très forte volumétrie</p>

--

## Le résultat

`SELECT * FROM table WHERE age = $1`

| Nb lignes | Sans index | Avec index |
|---------|-------------|----------|
| 1000 | < 1ms | < 1ms |
| 10k | 10ms | < 1ms |
| 100k | 300ms | 3ms |
| 1M | 15s | 70ms |
| 10M | prévoyez un bouquin | un long clin d'oeil |

---

# La syntaxe

```sql
CREATE [ UNIQUE ] INDEX [ CONCURRENTLY ] [ <name> ] ON <table>
    [ USING <method> ]
    ( { <column> | ( <expression> ) } [ <opclass> ]
    [ ASC | DESC ] [ NULLS { FIRST | LAST } ] [, ...] )
    [ WITH ( storage_parameter = <value> [, ... ] ) ]
    [ TABLESPACE <tablespace> ]
    [ WHERE <predicate> ]
```

😱😱😱

--

## La syntaxe décryptée

`CREATE INDEX [<name>] ON <table> (<column>)`

😌😌😌

--

## Note importante

Créer un index est une action qu'on ne fait qu'une seule fois, sa maintenance est gérée par le SGBD.
<p class="fragment">Par contre, elle peut prendre du temps (de quelques secondes à plusieurs heures dans certains cas).</p>
<p class="fragment">En production, la création d'un index se fait généralement de façon concurrente, avec le mot-clé <code>CONCURRENTLY</code>.</p>

--

## Les types d'index

D'un SGBD à l'autre, ce n'est pas toujours le même algorithme d'indexation qui est utilisé. La plupart des SGBD propose d'ailleurs plusieurs types.

Les 2 plus populaires sont :

---

## B-tree

![pg ok](https://img.shields.io/badge/PostgreSQL-disponible-success?logo=postgresql)
![my ok](https://img.shields.io/badge/MySQL-disponible-success?logo=mysql)
![maria ok](https://img.shields.io/badge/MariaDB-disponible-success?logo=mariadb)
![mssql ok](https://img.shields.io/badge/SQL%20Server-disponible-success?logo=microsoft-sql-server)
![oracle ok](https://img.shields.io/badge/Oracle-disponible-success?logo=oracle)

Le gendre idéal des index : optimisé pour la comparaison (`<`, `<=`, `=`, `>=`, `>`), il est par extension utilisé dans les `ORDER BY`, les `BETWEEN` et même les recherches par motif, quand le motif commence par une partie constante.

C'est le type par défaut, pas besoin de le préciser à la création.

--

### B-tree in action

Une table `review` contenant des notes entières, de 1 à 5.

2 requêtes qui font appel à cette table :

```sql
 -- affichage classique
SELECT * FROM review ORDER BY rating DESC;
 -- filtrage par note
SELECT * FROM review WHERE rating = $1;
```

--

### Performances

| requête | temps moyen |
|---------------|---------|
| affichage classique | ~4s |
| filtrage par note | ~2s |

--

### Un index plus tard

`CREATE INDEX review_rating_idx ON review (rating);`

| requête | temps moyen |
|---------------|---------|
| affichage classique | 50ms |
| filtrage par note | 40ms |

✅

---

## Hash

![pg ok](https://img.shields.io/badge/PostgreSQL-disponible-success?logo=postgresql)
![my variable](https://img.shields.io/badge/MySQL-variable-important?logo=mysql)
![maria ok](https://img.shields.io/badge/MariaDB-disponible-success?logo=mariadb)
![mssql no](https://img.shields.io/badge/SQL%20Server-indisponible-critical?logo=microsoft-sql-server)
![oracle ok](https://img.shields.io/badge/Oracle-disponible-success?logo=oracle)

Un index aussi spécifique qu'efficace : imbattable pour l'égalité, il n'est utile que dans ce cas. Si vous n'utilisez n'importe quel autre opérateur que `=` sur la colonne indexée, l'index sera indexé.

--

### Hash in action

La même table `review` mais liée à des produits.

Les 2 mêmes usages, dont les requêtes deviennent :

```sql
 -- affichage classique
SELECT * FROM review WHERE product_id = $1 ORDER BY rating DESC;
 -- filtrage par note
SELECT * FROM review WHERE product_id = $1 AND rating = $2;
```

--

### Performances

| requête | temps moyen |
|---------------|---------|
| affichage classique | ~4s |
| filtrage par note | ~2s |

--

### Un index plus tard

`CREATE INDEX review_rating_hash_idx ON review USING hash (product_id);`

| requête | temps moyen |
|---------------|---------|
| affichage classique | 8ms |
| filtrage par note | 1ms |

🚀

---

## Au cas où

<p class="fragment">MySQL, PostgreSQL et Oracle proposent des algorithmes d'indexation spécifiquement adaptés aux données géospatiales.</p>

<p class="fragment">Il est possible de créer un index sur un calcul plutôt que sur une colonne brute.</p>

<code class="fragment">CREATE INDEX review_email_idx ON review (lower(email_address));</code>

<p class="fragment">PostgreSQL est le seul à proposer <a href="https://www.percona.com/blog/2019/07/16/brin-index-for-postgresql-dont-forget-the-benefits/">un index spécialement conçu pour le Big Data</a></p>
