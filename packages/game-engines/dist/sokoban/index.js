/**
 * Sokoban Game Engine
 *
 * Classic box-pushing puzzle game
 * Push all boxes to goal positions to win
 */
import { generateGameId, } from '../types';
// =============================================================================
// Level Data (60 DOS Levels)
// =============================================================================
// Level format from begoon/sokoban-maps:
// X = wall, * = box, . = goal, @ = player, & = goal (alternate), space = floor
const LEVEL_DATA = `
; Level 1
    XXXXX
    X   X
    X*  X
  XXX  *XXX
  X  *  * X
XXX X XXX X     XXXXXX
X   X XXX XXXXXXX  ..X
X *  *             ..X
XXXXX XXXX X@XXXX  ..X
    X      XXX  XXXXXX
    XXXXXXXX

; Level 2
XXXXXXXXXXXX
X..  X     XXX
X..  X *  *  X
X..  X*XXXX  X
X..    @ XX  X
X..  X X  * XX
XXXXXX XX* * X
  X *  * * * X
  X    X     X
  XXXXXXXXXXXX

; Level 3
        XXXXXXXX
        X     @X
        X *X* XX
        X *  *X
        XX* * X
XXXXXXXXX * X XXX
X....  XX *  *  X
XX...    *  *   X
X....  XXXXXXXXXX
XXXXXXXX

; Level 4
              XXXXXXXX
              X  ....X
   XXXXXXXXXXXX  ....X
   X    X  * *   ....X
   X ***X*  * X  ....X
   X  *     * X  ....X
   X ** X* * *XXXXXXXX
XXXX  * X     X
X   X XXXXXXXXX
X    *  XX
X **X** @X
X   X   XX
XXXXXXXXX

; Level 5
        XXXXX
        X   XXXXX
        X X*XX  X
        X     * X
XXXXXXXXX XXX   X
X....  XX *  *XXX
X....    * ** XX
X....  XX*  * @X
XXXXXXXXX  *  XX
        X * *  X
        XXX XX X
          X    X
          XXXXXX

; Level 6
XXXXXX  XXX
X..  X XX@XX
X..  XXX   X
X..     ** X
X..  X X * X
X..XXX X * X
XXXX * X*  X
   X  *X * X
   X *  *  X
   X  XX   X
   XXXXXXXXX

; Level 7
       XXXXX
 XXXXXXX   XX
XX X @XX ** X
X    *      X
X  *  XXX   X
XXX XXXXX*XXX
X *  XXX ..X
X * * * ...X
X    XXX...X
X ** X X...X
X  XXX XXXXX
XXXX

; Level 8
  XXXX
  X  XXXXXXXXXXX
  X    *   * * X
  X *X * X  *  X
  X  * *  X    X
XXX *X X  XXXX X
X@X* * *  XX   X
X    * X*X   X X
XX  *    * * * X
 XXXX  XXXXXXXXX
  XXX  XXX
  X      X
  X      X
  X......X
  X......X
  X......X
  XXXXXXXX

; Level 9
          XXXXXXX
          X  ...X
      XXXXX  ...X
      X      ...X
      X  XX  ...X
      XX XX  ...X
     XXX XXXXXXXX
     X *** XX
 XXXXX  * * XXXXX
XX   X* *   X   X
X@ *  *    *  * X
XXXXXX ** * XXXXX
     X *    X
     XXXX XXX
        X  X
        X  X
        X  X
        XXXX

; Level 10
              XXXX
         XXXXXX  X
         X       X
         X  XXXX XXX
 XXX  XXXXX XXX    X
XX@XXXX   *** X    X
X **   ** *   X....XX
X  ***X    *  X.....X
X *   X ** ** X.....X
XXX   X  *    X.....X
  X   X * * * X.....X
  X XXXXXXX XXX.....X
  X   X  * *  X.....X
  XXX X ** * *XXXXXXX
    X X  *      X
    X X *** *** X
    X X       X X
    X XXXXXXXXX X
    X           X
    XXXXXXXXXXXXX

; Level 11
          XXXX
     XXXX X  X
   XXX  XXX* X
  XX   @  *  X
 XX  * **XX XX
 X  X*XX     X
 X X * ** X XXX
 X   * X  X * XXXXX
XXXX    X  ** X   X
XXXX XX *         X
X.    XXX  XXXXXXXX
X.. ..X XXXX
X...X.X
X.....X
XXXXXXX

; Level 12
  XXXXXXXXX
  X&.&X&.&X
  X.&.&.&.X
  X&.&.&.&X
  X.&.&.&.X
  X&.&.&.&X
  XXX   XXX
    X   X
XXXXXX XXXXXX
X           X
X * * * * * X
XX * * * * XX
 X* * * * *X
 X   *@*   X
 X  XXXXX  X
 XXXX   XXXX

; Level 13
    XXXXXXXXX
  XXX   XX  XXXXX
XXX      X  X   XXXX
X  ** X* X  X  ... X
X X  *X@*XX X X.X. X
X  XX X*  X    ... X
X *X    * X X X.X. X
X    XX  XX* * ... X
X * XX   X  X*X.X. X
XX **  *   *  *... X
 X*  XXXXXX    XX  X
 X   X    XXXXXXXXXX
 XXXXX

; Level 14
XXXXXXXXXXXXXXXX
X              X
X X XXXXXX     X
X X  * * * *X  X
X X   *@*   XX XX
X X X* * *XXX...X
X X   * *  XX...X
X XXX*** * XX...X
X     X XX XX...X
XXXXX   XX XX...X
    XXXXX     XXX
        X     X
        XXXXXXX

; Level 15
       XXXX
    XXXX  X
   XX  X  X
   X  * * X
 XXX X*   XXXX
 X  *  XX*   X
 X  X @ * X *X
 X  X      * XXXX
 XX XXXX*XX     X
 X *X.....X X   X
 X  *...&. *X XXX
XX  X.....X   X
X   XXX XXXXXXX
X **  X  X
X  X     X
XXXXXX   X
     XXXXX

; Level 16
XXXXX
X   XX
X    X  XXXX
X *  XXXX  X
X  ** *   *X
XXX@ X*    XX
 X  XX  * * XX
 X *  XX XX .X
 X  X*XX*  X.X
 XXX   *..XX.X
  X    X.&...X
  X ** X.....X
  X  XXXXXXXXX
  X  X
  XXXX

; Level 17
       XXXXXXX
 XXXXXXX     X
 X     X *@* X
 X** X   XXXXXXXXX
 X XXX......XX   X
 X   *......XX X X
 X XXX......     X
XX   XXXX XXX X*XX
X  X*   X  *  X X
X  * ***  X *XX X
X   * * XXX** X X
XXXXX     *   X X
    XXX XXX   X X
      X     X   X
      XXXXXXXX  X
             XXXX

; Level 18
      XXXXXXXXXXXX
      X  .  XX   X
      X X.     @ X
 XXXXXX XX...X XXXX
XX  XX...XXXX     XXXX
X * XX...    * X  *  X
X     .. XX X XX XX  X
XXXX*XXX*X *  X   X XX
 XXX  X    XX* ** X X
 X   ** X X * X *XX X
 X                  X
 XXXXXXXXXXXXXXXXX  X
                 XXXX

; Level 19
        XXXXXX
        X   @XXXX
      XXXXX *   X
      X   XX    XXXX
      X *XX  XX    X
      X   X  XXXXX X
      X X** *    X X
      X  * * XXX X X
      X X   *  X X X
      X X  X*X   X X
     XX XXXX   X X X
     X  *  XXXXX X X XXXX
    XX    *     *  XXX  XXXX
XXXXX  XXX * *X * X   .....X
X     XX      X  XX  X.....X
X ****    XXXXXX*XX   X.XX.X
XX    XX              X....X
 XX  XXXXXXXXXXXXXXX   ....X
  X  X             XXXXX  XX
  XXXX                 XXXX

; Level 20
       XXXXXXXXXXXX
       X..........X
     XXX.X.X.X.X..X
     X   .........X
     X@ * * * &.&.X
    XXXXXXX XXXXXXX
 XXXX   X    XX  X
XX    * X    X * XX
X  X*X XXX XXX*   XX
X *  * *   X * * * X
X  X * XX       X* X
X   *XXXX*XXXX*XX  X
XXXX  XX   X    X  X
   X* XX   X X **  X
   X   X * X  *    X
   XXX X ** X  * XXX
     X X    X * XX
     X XXXXXXXX X
     X          X
     XXXXXXXXXXXX

; Level 21
   XXXXXXXXXX
   X..  X   X
   X..      X
   X..  X  XXXX
  XXXXXXX  X  XX
  X            X
  X  X  XX  X  X
XXXX XX  XXXX XX
X  *  XXXXX X  X
X X *  *  X *  X
X @*  *   X   XX
XXXX XX XXXXXXX
   X    X
   XXXXXX

; Level 22
            XXXX
 XXXXXXXXXXXX  XXXXX
 X    X  X  *  X   XX
 X * * *  * X * *   X
 XX* *   X @X *   * X
XXX   XXXXXXXXXXXX XX
X  * *X  X......X *X
X X   X  X......XX X
X  XX XX X .....X  X
X X      *...... * X
X X * XX X......X  X
X  * *X  X......X *X
X *   X  XX*XXXXX  X
X * * XXXX * *  * *X
XX X     * * * *   XXX
 X  XXXXXX *    *    X
 X         X XXXXXXX X
 XXXXXXX X*          X
       X   XXXXXXXXXXX
       XXXXX

; Level 23
       XXXXXXX
       X  X  XXXX
       X *X* X  XX
XXXXXXXX  X  X   XXXXXXXX
X....  X *X* X  *X  X   X
X....X X     X*  X      X
X..X.    *X  X *    X*  X
X... @XX  X* X*  X  X   X
X.... XX *X     *XXXXXXXX
XXXXXXXX  X**X*  X
       X *X  X  *X
       X  X  X   X
       XXXX  XXXXX
          XXXX

; Level 24
   XXXXXXXXXX
   X........XXXX
   X.X.X....X  X
   X........** X
   X     .XXX  XXXX
 XXXXXXXXX  * X   X
 X     *   * *  * X
 X  X    X  * *X  X
 XX XXXXX   X  X  X
 X *     X   XXXX X
XX  *X   X XX  X  X
X    XX*XXX    X  XX
X *    * X  X  X   X
XXXXX    X XX X XX XX
    X*X X  *  * *   X
    X@X  *X***  X   X
    XXX  *      XXXXX
      XX  X  X  X
       XXXXXXXXXX

; Level 25
               XXXX
          XXXXXX  XXXXX
    XXXXXXX       X   X
    X      * * XX X X X
    X  XXXX *  X     .X
    X      * X X XX.X.X
    XX*XXXX* * * XX.X.X
    X     X    XXXX.XXX
    X *   XXXXXX  X.X.X
XXXXXX***XX      @X.X.X
X      X    X*X*XXX. .X
X XXXX X*****    X ...X
X X    *     X   X ...X
X X   XX XX     XXX...X
X XXXXXX*XXXXXX  XXXXXX
X        X    X  X
XXXXXXXXXX    XXXX

; Level 26
XXXXXXXXX
X       X
X       XXXX
XX XXXX X  X
XX X@XX    X
X *** *  **X
X  X XX *  X
X  X XX  * XXXX
XXXX  *** *X  X
 X   XX   ....X
 X X   X X.. .X
 X   X X XX...X
 XXXXX *  X...X
     XX   XXXXX
      XXXXX

; Level 27
 XXXXXXXXXXXXXXXXX
 X...   X    X   XXX
XX.....  *XX X X * X
X......X  *  X  *  X
X......X  X  X X X XX
XXXXXXXXX *  * X X  XXX
  X     X*XX* XX XX   X
 XX   *    X *  *   X X
 X  XX XXX X  XXXXX*X X
 X * **     *   *     X
 X *    *XX* XXXXXXXX X
 XXXXXXX  @ XX      XXX
       XXXXXX

; Level 28
     XXXXXXX
     X@ X  X
     X *   X
    XXX XX X
 XXXX *  X XX
 X       X  XX
 X * *XXXX * X
 X ** X  X  *X
 X*  *   X*  X
XX  **X   ** XX
X **  X  X  * X
X     XXXX *  X
X  X*XX..XX   X
XXX .X....XXXXX
  X .......XX
  X....   ..X
  XXXXXXXXXXX

; Level 29
                XXXXX
       XXXXXX XXX   XXXX
   XXXXX    XXX * *  * X
XXXX  XX X* *    * X   X
X....   ** * *  *   X*XX
X.. X XX X   XXX*XX X  X
X....    X XXX    X    X
X....    X XX  *  XXX* X
X..XXXXXX  *  X  XXXX XX
XXXX    X   XXX    @  X
        XXXXXXXXXXXXXXX

; Level 30
 XXXXX
 X   XXXXXXX
 X * XXX   X
 X *    ** X
 XX XXXX   X
XXX X  X XXX
X   X  X@XX
X **    * X
X   X X * XXXX
XXXXX X   X  X
 X   *XXXX   X
 X  *     *  X
 XX   XXXXX XX
 XXXXXXXXXX  X
XX....X *  * X
X.....X **X  X
X.. ..X *  * X
X.....*   X  X
XX  XXXXXXXXXX
 XXXX

; Level 31
 XXXXXXX
 X  X  XXXXX
XX  X  X...XXX
X  *X  X...  X
X * X** ...  X
X  *X  X... .X
X   X *XXXXXXXX
XX*       * * X
XX  X  ** X   X
 XXXXXX  XX**@X
      X      XX
      XXXXXXXX

; Level 32
  XXXX
  X  XXXXXXXXX
 XX  XX @X   X
 X  *X * *   XXXX
 X*  *  X * *X  XX
XX  *XX X* *     X
X  X  X X   ***  X
X *    *  *XX XXXX
X * * X*X  X  X
XX  XXX  XXX* X
 X  X....     X
 XXXX......XXXX
   X....XXXX
   X...XX
   X...X
   XXXXX

; Level 33
      XXXX
  XXXXX  X
 XX     *X
XX *  XX XXX
X@* * X *  X
XXXX XX   *X
 X....X* * X
 X....X   *X
 X....  ** XX
 X... X *   X
 XXXXXX* *  X
      X   XXX
      X* XXX
      X  X
      XXXX

; Level 34
XXXXXXXXXXXX
XX     XX  X
XX   *   * X
XXXX XX ** X
X   * X    X
X *** X XXXX
X   X X * XX
X  X  X  * X
X *X *X    X
X   ..X XXXX
XXXX.. * X@X
X.....X *X X
XX....X  * X
XXX..XX    X
XXXXXXXXXXXX

; Level 35
XXXXXXXXXXXX  XXXXXX
X   X    X@XXXX....X
X   **X       .....X
X   X XXX   XX ....X
XX XX XXX  X   ....X
 X * *     X XX XXXX
 X  * *XX  X       X
XXXX X  XXXX XX XX X
X  X X*   XX XX    X
X *  *  X XX XXXXXXX
X X * *    X X
X  * XX XX X X
X **     **  X
XX XX XXX *  X
 X    X X    X
 XXXXXX XXXXXX

; Level 36
     XXXX
   XXX  XX
XXXX  *  X
X   * *  XXXX
X *   X *   X XXXX
X  X  X   * X X..X
XX*X* XXXX*XXXX..X
 X   XXXXX XX ...X
 X*X XX@XX XX  ..X
 X X    *     ...X
 X   XXXX XXX  ..X
 XXX XX X  XX ...X
  XX* XXXX* XXX..X
  X   XX    X X..X
 XX **XX  * X XXXX
 X     **** X
 X * XXX    X
 X   X XXXXXX
 XXXXX

; Level 37
XXXXXXXXXXX
X......   XXXXXXXXX
X......   X  XX   X
X..XXX *    *     X
X... * * X  XXX   X
X...X*XXXXX    X  X
XXX    X   X*  X *XXX
  X  ** * *  *XX  * X
  X  *   X*X  XX    X
  XXX XX X  * XXXXXXX
   X  * * XX XX
   X    *  *  X
   XX   X X   X
    XXXXX@XXXXX
        XXX

; Level 38
 XXXXXXXXX
 X....   XX
 X.X.X  * XX
XX....X X @XX
X ....X  X  XX
X     X* XX* X
XX XXX  *    X
 X*  * * *X  X
 X X  * * XX X
 X  XXX  XX  X
 X    XX XX XX
 X  * X  *  X
 XXX* *   XXX
   X  XXXXX
   XXXX

; Level 39
              XXX
             XX.XXX
             X....X
 XXXXXXXXXXXXX....X
XX   XX     XX....XXXXX
X  **XX  * @XX....    X
X      ** *X  ....X   X
X  * XX ** X X....X  XX
X  * XX *  X XX XXX  X
XX XXXXX XXX         X
XX   *  * XXXXX XXX  X
X *XXX  X XXXXX X XXXX
X   *   X       X
X  * X* * *XXX  X
X ***X *   X XXXX
X    X  ** X
XXXXXX   XXX
     XXXXX

; Level 40
      XXXX
XXXXXXX @X
X     *  X
X   *XX *X
XX*X...X X
 X *...  X
 X X. .X XX
 X   X X* X
 X*  *    X
 X  XXXXXXX
 XXXX

; Level 41
           XXXXX
          XX   XX
         XX     X
        XX  **  X
       XX **  * X
       X *    * X
XXXX   X   ** XXXXX
X  XXXXXXXX XX    X
X..           ***@X
X.X XXXXXXX XX   XX
X.X XXXXXXX. X* *XXX
X........... X   * X
XXXXXXXXXXXXXX  *  X
             XX  XXX
              XXXX

; Level 42
 XXXXXXXX
 X@XX   XXXX
 X *   *   X
 X  * * ***X
 X **X X   X
XX*    *   X
X  *  *****XX
X *XXXX X   X
X  *....X   X
X XX....X** X
X XX....   XX
X   ....X  X
XX X....X**X
 X X....X  X
 X         X
 XXXX XX*XXX
    X    X
    XXXXXX

; Level 43
    XXXXXXXXXXXX
    X          XX
    X  X X** *  X
    X* X*X  XX @X
   XX XX X * X XX
   X   * X*  X X
   X   X *   X X
   XX * *   XX X
   X  X  XX  * X
   X    XX **X X
XXXXXX**   X   X
X....X  XXXXXXXX
X.X... XX
X....   X
X....   X
XXXXXXXXX

; Level 44
      XXXXXX
   XXXXX   X
   X   X X XXXXX
   X * X  *    XXXXXX
  XX*  XXX XX       X
XXX  ** * * X  XX   XXXXX
X       *   XXXXXX XX   X
X  XXXXXXXX X@   X X  X X
XX XXX      XXXX X*X X  X
 X XXX XXXX XX.. X   * XX
 X  *  *  X*XX.. X*XX  XX
 X  X X X     ..XX XX * X
 XXXX   X XX X..X    *  X
    XXXXX    X..X X X  XX
        XXXXXX..X   X XX
             X..XXXXX  X
             X..       X
             XX  XXX  XX
              XXXXXXXXX

; Level 45
        XXXXXXX
    XXXXX  X  XXXX
    X   X   *    X
 XXXX X** XX XX  X
XX      X X  XX XXX
X  XXX *X*  *  *  X
X...    X XX  X   X
X...X    @ X XXX XX
X...X  XXX  *  *  X
XXXXXXXX XX   X   X
          XXXXXXXXX

; Level 46
    XXXXXXXXX  XXXX
    X   XX  XXXX  X
    X   *   X  *  X
    X  X XX X     XXXX
    XX *   * **X X   X
    XXXX  X  X * *   X
XXXXX  XXXX    XXX...X
X   X* X  X XXXX.....X
X      X  X X XX.....X
XXXXXX X  X*   XXX...X
   X   XX X *X   X...X
  XX       *  *X XXXXX
 XX ***XX  X *   X
 X   X  X XXX  XXX
 X   *  X* @XXXX
 XXXXX  X   X
     XXXXXXXX

; Level 47
 XXXXX
 X   X
 X X XXXXXX
 X      *@XXXXXX
 X * XX* XXX   X
 X XXXX *    * X
 X XXXXX X  X* XXXX
XX  XXXX XX*      X
X  *X  *  X XX XX X
X         X X...X X
XXXXXX  XXX  ...  X
     XXXX X X...X X
          X XXX X X
          X       X
          XXXXXXXXX

; Level 48
       XXXX
       X  XX
       X   XX
       X ** XX
     XXX*  * XX
  XXXX    *   X
XXX  X XXXXX  X
X    X X....* X
X X   * ....X X
X  * X X.&..X X
XXX  XXXX XXX X
  XXXX @*  XX*XX
     XXX *     X
       X  XX   X
       XXXXXXXXX

; Level 49
      XXXXXXXXXXXX
     XX..    X   X
    XX..& *    * X
   XX..&.X X X* XX
   X..&.X X X *  X
XXXX...X  X    X X
X  XX X          X
X @* * XXX  X X XX
X *   *   X X   X
XXX**   X X X X X
  X   *   X X XXXXX
  X *X XXXXX      X
  X*   X   X   X  X
  X  XXX   XX     X
  X  X      X    XX
  XXXX      XXXXXX

; Level 50
     XXXXXXXXXXXXX
     X    XXX    X
     X     * *  XXXX
   XXXX X   * *    X
  XX *  X*XXXX * * X
XXX   X X   XXX  * X
X *  *  X  *  X XXXX
X XX*XXXX X*X  *  XXX
X XX  XXX X X X  *  X
X    @*   *   X * X X
XXXXX  X  XX  X *X  X
  X... XXXXX*  X  X X
  X.......X ** X* X X
  X.......X         X
  X.......XXXXXXX  XX
  XXXXXXXXX     XXXX

; Level 51
XXXXX XXXX
X...X X  XXXX
X...XXX  *  X
X....XX *  *XXX
XX....XX   *  X
XXX... XX * * X
X XX    X  *  X
X  XX X XXX XXXX
X * X X*  *    X
X  * @ *    *  X
X   X * ** * XXX
X  XXXXXX  XXX
X XX    XXXX
XXX

; Level 52
 XXXX
XX  XXXXX
X       X XXXXX
X *XXX  XXX   X
X..X  *X X  X X
X..X      **X XXX
X.&X X  X* *    XXXXX
X..X  XX     XX*X   X
X.&*  * X XX  *     X
X..XX  *   X   XXXXXX
X.&XX*XX   XXXXX
X..  * XXXXX
X  X @ X
XXXXXXXX

; Level 53
   XXXXXXXXXX
   X  XXX   X
   X *   *  X
   X  XXXX*XX
   XX X  X  X
  XX  X.&   X
  X  XX..X  X
  X @ X.&X XX
  X X*X..X* X
  X * X..X  X
  X X X&&X  X
  X * X..X*XX
  X    .&X  X
 XXX  X  X  X
XX    XXXX  X
X  XXXXXXX*XX
X *      *  X
X  XX   X   X
XXXXXXXXXXXXX

; Level 54
 XXXXXXXXXXXXXXXXXXXXX
 X   XX  X   X   X   X
 X *     *   *   *   XX
XXXXX X  X   XXX XX*XXX
X   X XX*XXXXXX   X   X
X *   X ......X   X * X
XX X  X ......XXXXX   X
XX XXXXXXXXX..X   X XXX
X          X..X *   X
X XX XXX XXX..XX X  XXX
X X   X   XX..XX XXX  X
X   @      *..X       X
X X   X   XX  X   XX  X
XXXXX XXXXXXXXXXXXXX XX
X          X   X    * X
X *  X * * *   X X    X
X X*XX *X  XX XX    X X
X  * ** XXXX *  * X X X
X          X   X      X
XXXXXXXXXXXXXXXXXXXXXXX

; Level 55
 XXXXXXXXXXXXXXXXXXXXX
XX                   X
X    * X      XX X   X
X  XXXXXX XXX  X*XX XX
XX*X   XX*X....   X X
X  X    * X....XX X X
X * X X X X....XX   X
X * X**   X....XX*X X
X X *@*XX*X....XX   X
X   ***   X....X    X
X  *X   X XXXXXX *XXX
XX  X XXX**  *   * X
XX     X *  * XX   X
 XXXXX   X   XXXXXXX
     XXXXXXXXX

; Level 56
XXXXXXXXXX
X        XXXX
X XXXXXX X  XX
X X * * *  * X
X       X*   X
XXX*  **X  XXX
  X  XX X *XX
  XX*X   * @X
   X  * * XXX
   X X   *  X
   X XX   X X
  XX  XXXXX X
  X         X
  X.......XXX
  X.......X
  XXXXXXXXX

; Level 57
         XXXX
 XXXXXXXXX  XX
XX  *      * XXXXX
X   XX XX   XX...X
X X** * **X*XX...X
X X    @  X   ...X
X  *X XXX**   ...X
X *  **  * XX....X
XXX*       XXXXXXX
  X  XXXXXXX
  XXXX

; Level 58
              XXXXXX
          XXXXX    X
          X  XX X  XXXXX
          X   &.X..X   X
 XXXXX XXXX *X.X...    X
 X   XXX  XX X&....XX XX
 X *      XX X..X..XX X
XXXXXX X   X X&.XXXXX X
X   X *X*X X X..XXXXX X
X *  *     X X&.    X X
XX XX  * XXX X  XX  X X
 X  *  * XXX XXXXX XX X
 XXX*XXX*XXX  XXXX XX X
XXXX X         XXX  X X
X  * X  *XXXX  XXX**X@XXXXX
X      * X X  XXXX  X*X   X
XXXX X  *X X              X
   X  *  X XX  XX  XXXXXXXX
   XX  XXX  XXXXXXXX
    XXXX

; Level 59
         XXXX
         X  X
         X  XXXXXXXX
   XXXXXXX  X      X
   X   X X X X X   XX
   X *     *  XX  * X
  XXX *X X  X X     XXXXXXXXX
  X  *  X  *X X ** X   X X  X
 XX X   X     XXX    * X X  X
 X  X*   X XXX  X  X **X X  X
 X    *XX *  X   XX *  X X XX
XXXX* * X    XX  X   *    ..X
X  X    XXX X * * XXX  XXX.&X
X     XX  ** @  *     XX....X
X  XX  XX   *  X*X  XX....&.X
XX X  *  X X *XX  XX....&.XXX
XX XX  *  X * X  X....&.XXX
X    * XXXX   X ....&.XXX
X   X  X  X  X  ..&.XXX
XXXXXXXX  XXXXXXXXXXX

; Level 60
        XXXXX
        X   XXXX
        X *    XXXX  XXXX
        X   X *X  XXXX  X
XXXXXXXXXXX X   *   X   X
X..     X *  XXXX X  X  X
X..*  X   *  X  * X * .XX
X.&X X * * XX  XX    X.X
X..X* @ X   XX    ** X.X
X..X * *  * * XX   XX .X
X.&** X XX   * X*X * X.X
X..X      XX   X     X.X
X..XXXXXXX  XXX XXXXXX.XX
X **                  &.XX
X  XXXXXXXXXXXXXXXXXX  ..X
XXXX                XXXXXX
`.trim();
// Parse level string into structured data
function parseLevel(levelStr) {
    const lines = levelStr.split('\n').filter(line => !line.startsWith(';') && line.trim());
    if (lines.length === 0)
        return null;
    const rows = lines.length;
    const cols = Math.max(...lines.map(l => l.length));
    const board = [];
    let player = { row: 0, col: 0 };
    const boxes = [];
    const goals = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        const line = lines[r].padEnd(cols, ' ');
        for (let c = 0; c < cols; c++) {
            const char = line[c];
            switch (char) {
                case 'X':
                    row.push('wall');
                    break;
                case '.':
                case '&':
                    row.push('goal');
                    goals.push({ row: r, col: c });
                    break;
                case '*':
                    row.push('floor');
                    boxes.push({ row: r, col: c });
                    break;
                case '@':
                    row.push('floor');
                    player = { row: r, col: c };
                    break;
                case '+': // Player on goal
                    row.push('goal');
                    goals.push({ row: r, col: c });
                    player = { row: r, col: c };
                    break;
                case '$': // Alternative box symbol
                    row.push('floor');
                    boxes.push({ row: r, col: c });
                    break;
                default:
                    row.push('floor');
            }
        }
        board.push(row);
    }
    return { board, player, boxes, goals, rows, cols };
}
// Parse all levels
function parseLevels() {
    const levelStrings = LEVEL_DATA.split(/\n\n+/);
    return levelStrings.map(parseLevel).filter((l) => l !== null);
}
const LEVELS = parseLevels();
// =============================================================================
// Helper Functions
// =============================================================================
function posEquals(a, b) {
    return a.row === b.row && a.col === b.col;
}
function posInList(pos, list) {
    return list.some(p => posEquals(p, pos));
}
function getDirection(dir) {
    switch (dir) {
        case 'up': return { row: -1, col: 0 };
        case 'down': return { row: 1, col: 0 };
        case 'left': return { row: 0, col: -1 };
        case 'right': return { row: 0, col: 1 };
    }
}
function addPos(a, b) {
    return { row: a.row + b.row, col: a.col + b.col };
}
function isWall(board, pos) {
    if (pos.row < 0 || pos.row >= board.length)
        return true;
    if (pos.col < 0 || pos.col >= board[0].length)
        return true;
    return board[pos.row][pos.col] === 'wall';
}
function checkWin(boxes, goals) {
    if (boxes.length !== goals.length)
        return false;
    return boxes.every(box => posInList(box, goals));
}
// =============================================================================
// Sokoban Engine Implementation
// =============================================================================
function createSokobanEngine() {
    return {
        metadata: {
            id: 'sokoban',
            name: 'Sokoban',
            description: 'Classic box-pushing puzzle from DOS era',
            difficulty: 'hard',
            points: 150,
            transport: 'sse',
            minPlayers: 1,
            maxPlayers: 1,
        },
        newGame(options = {}) {
            const levelIndex = Math.min(options.levelIndex ?? 0, LEVELS.length - 1);
            const level = LEVELS[levelIndex];
            if (!level) {
                throw new Error(`Level ${levelIndex} not found`);
            }
            return {
                gameId: generateGameId(),
                status: 'playing',
                turn: 'player',
                moveCount: 0,
                board: level.board.map(row => [...row]),
                player: { ...level.player },
                boxes: level.boxes.map(b => ({ ...b })),
                goals: level.goals.map(g => ({ ...g })),
                rows: level.rows,
                cols: level.cols,
                levelIndex,
                totalLevels: LEVELS.length,
                pushCount: 0,
            };
        },
        validateState(state) {
            if (!state || typeof state !== 'object')
                return false;
            const s = state;
            return (typeof s.gameId === 'string' &&
                Array.isArray(s.board) &&
                typeof s.player === 'object' &&
                Array.isArray(s.boxes) &&
                Array.isArray(s.goals));
        },
        getLegalMoves(state) {
            const moves = [];
            const directions = ['up', 'down', 'left', 'right'];
            for (const direction of directions) {
                const delta = getDirection(direction);
                const newPos = addPos(state.player, delta);
                // Check if blocked by wall
                if (isWall(state.board, newPos))
                    continue;
                // Check if pushing a box
                if (posInList(newPos, state.boxes)) {
                    const boxNewPos = addPos(newPos, delta);
                    // Can't push if wall or another box behind
                    if (isWall(state.board, boxNewPos))
                        continue;
                    if (posInList(boxNewPos, state.boxes))
                        continue;
                }
                moves.push({ direction });
            }
            return moves;
        },
        isLegalMove(state, move) {
            return this.getLegalMoves(state).some(m => m.direction === move.direction);
        },
        makeMove(state, move) {
            if (!this.isLegalMove(state, move)) {
                return {
                    state,
                    valid: false,
                    error: `Cannot move ${move.direction}`,
                };
            }
            const delta = getDirection(move.direction);
            const newPlayerPos = addPos(state.player, delta);
            const newBoxes = state.boxes.map(b => ({ ...b }));
            let pushed = false;
            // Check if pushing a box
            const boxIndex = newBoxes.findIndex(b => posEquals(b, newPlayerPos));
            if (boxIndex !== -1) {
                const boxNewPos = addPos(newPlayerPos, delta);
                newBoxes[boxIndex] = boxNewPos;
                pushed = true;
            }
            const won = checkWin(newBoxes, state.goals);
            const newState = {
                ...state,
                player: newPlayerPos,
                boxes: newBoxes,
                moveCount: state.moveCount + 1,
                pushCount: state.pushCount + (pushed ? 1 : 0),
                status: won ? 'won' : 'playing',
                lastMoveAt: Date.now(),
            };
            if (won) {
                return {
                    state: newState,
                    valid: true,
                    result: this.getResult(newState) ?? undefined,
                };
            }
            return { state: newState, valid: true };
        },
        getAIMove() {
            return null; // Single player game
        },
        isGameOver(state) {
            return state.status === 'won';
        },
        getResult(state) {
            if (state.status !== 'won')
                return null;
            return {
                status: 'won',
                totalMoves: state.moveCount,
                metadata: {
                    levelIndex: state.levelIndex,
                    pushCount: state.pushCount,
                    boxCount: state.boxes.length,
                },
            };
        },
        serialize(state) {
            return JSON.stringify(state);
        },
        deserialize(data) {
            const parsed = JSON.parse(data);
            if (!this.validateState(parsed)) {
                throw new Error('Invalid sokoban state data');
            }
            return parsed;
        },
        renderText(state) {
            const { board, player, boxes, goals, rows, cols } = state;
            const lines = [];
            lines.push(`Level ${state.levelIndex + 1}/${state.totalLevels}`);
            lines.push('');
            for (let r = 0; r < rows; r++) {
                let line = '';
                for (let c = 0; c < cols; c++) {
                    const pos = { row: r, col: c };
                    const isPlayer = posEquals(pos, player);
                    const isBox = posInList(pos, boxes);
                    const isGoal = posInList(pos, goals);
                    const cell = board[r][c];
                    if (isPlayer && isGoal) {
                        line += '+'; // Player on goal
                    }
                    else if (isPlayer) {
                        line += '@';
                    }
                    else if (isBox && isGoal) {
                        line += '*'; // Box on goal
                    }
                    else if (isBox) {
                        line += '$';
                    }
                    else if (isGoal) {
                        line += '.';
                    }
                    else if (cell === 'wall') {
                        line += '#';
                    }
                    else {
                        line += ' ';
                    }
                }
                lines.push(line);
            }
            lines.push('');
            lines.push(`Moves: ${state.moveCount} | Pushes: ${state.pushCount}`);
            lines.push(`Boxes on goals: ${boxes.filter(b => posInList(b, goals)).length}/${goals.length}`);
            if (state.status === 'won') {
                lines.push('');
                lines.push('🎉 Level Complete!');
            }
            return lines.join('\n');
        },
        renderJSON(state) {
            const { board, player, boxes, goals, rows, cols } = state;
            // Create visual board representation
            const visualBoard = [];
            for (let r = 0; r < rows; r++) {
                const row = [];
                for (let c = 0; c < cols; c++) {
                    const pos = { row: r, col: c };
                    const isPlayer = posEquals(pos, player);
                    const isBox = posInList(pos, boxes);
                    const isGoal = posInList(pos, goals);
                    const cell = board[r][c];
                    if (isPlayer && isGoal) {
                        row.push('player_on_goal');
                    }
                    else if (isPlayer) {
                        row.push('player');
                    }
                    else if (isBox && isGoal) {
                        row.push('box_on_goal');
                    }
                    else if (isBox) {
                        row.push('box');
                    }
                    else if (isGoal) {
                        row.push('goal');
                    }
                    else if (cell === 'wall') {
                        row.push('wall');
                    }
                    else {
                        row.push('floor');
                    }
                }
                visualBoard.push(row);
            }
            return {
                gameType: 'sokoban',
                gameId: state.gameId,
                status: state.status,
                turn: state.turn,
                moveCount: state.moveCount,
                legalMoves: this.getLegalMoves(state).map(m => m.direction),
                board: {
                    cells: visualBoard,
                    rows,
                    cols,
                },
                extra: {
                    levelIndex: state.levelIndex,
                    totalLevels: state.totalLevels,
                    pushCount: state.pushCount,
                    boxesOnGoals: boxes.filter(b => posInList(b, goals)).length,
                    totalBoxes: boxes.length,
                    player: state.player,
                },
            };
        },
        formatMove(move) {
            return move.direction;
        },
        parseMove(input) {
            const dir = input.trim().toLowerCase();
            const dirMap = {
                'up': 'up', 'u': 'up', 'w': 'up',
                'down': 'down', 'd': 'down', 's': 'down',
                'left': 'left', 'l': 'left', 'a': 'left',
                'right': 'right', 'r': 'right',
            };
            if (dir in dirMap) {
                return { direction: dirMap[dir] };
            }
            return null;
        },
    };
}
// =============================================================================
// Export
// =============================================================================
export const sokobanEngine = createSokobanEngine();
export const SOKOBAN_LEVELS = LEVELS;
export const TOTAL_LEVELS = LEVELS.length;
//# sourceMappingURL=index.js.map