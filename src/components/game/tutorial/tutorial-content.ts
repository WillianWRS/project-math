export const TUTORIAL_FINAL_TARGET = 10

export type TutorialStep =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18

export const TUTORIAL_MESSAGES: Record<TutorialStep, string> = {
  0: 'Acerte o máximo de cálculos que conseguir.',
  1: 'Esse é o número base.',
  2: 'Essa é a operação.',
  3: 'Aqui é onde os números digitados aparecem.',
  4: 'Digite a resposta da operação.',
  5: 'Sua vez: digite o resultado de 5 + 2. Tempo infinito.',
  6: 'O tempo restante para cada cálculo é exibido na barra acima, quando o tempo se esgota a partida acaba.',
  7: 'Durante o jogo podem aparecer alguns modificadores que mudam as regras durante alguns cálculos.',
  8: 'Modificador de tiro rápido, os cálculos a seguir tem apenas 4 segundos para resolver mas só aparecem operações de + e - .',
  9: 'Modificador de dividir e multiplicar, os cálculos a seguir serão somente multiplicação ou divisão.',
  10: 'Modificador de subida ao 99, os cálculos a seguir serão apenas soma até chegar em 99 .',
  11: 'Modificador de descida ao 1, os cálculos a seguir serão apenas subtrações até chegar a 1.',
  12: 'Durante o jogo auto checks podem aparecer, utilizá-lo resolve uma conta automaticamente.',
  13: 'Você pode acumular auto checks ganhos durante o jogo e adquirir mais auto checks no menu de jogador',
  14: 'Utilize um auto check',
  15: '',
  16: 'Mostre o que aprendeu, resolva 10 cálculos e complete o tutorial.',
  17: '',
  18: '',
}
