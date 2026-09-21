export type OracleCard = Readonly<{
  id: string;
  title: string;
  keywords: string;
  image: string;
  currentReading: string;
  futureReading: string;
}>;

export const ORACLE_CARDS: readonly OracleCard[] = [
  {
    id: "sunrise",
    title: "떠오르는 해",
    keywords: "시작 · 회복",
    image: "/oracle/illustrations/sunrise.webp",
    currentReading: "지금의 고민에는 다시 시작할 수 있는 힘이 남아 있습니다. 이미 늦었다고 단정하기보다 가장 작은 변화부터 시도해 보세요. 마음과 상황이 서서히 밝아지면서 다음 방향도 함께 보이기 시작합니다.",
    futureReading: "앞으로는 멈춰 있던 흐름이 천천히 움직이기 시작합니다. 처음부터 큰 결과를 기대하기보다 회복되는 신호를 하나씩 확인하는 것이 좋습니다. 작은 시작을 꾸준히 이어가면 새로운 가능성이 더욱 선명해집니다.",
  },
  {
    id: "lantern-crossroads",
    title: "갈림길의 등불",
    keywords: "선택 · 방향",
    image: "/oracle/illustrations/lantern-road.webp",
    currentReading: "지금은 답이 없어서가 아니라 여러 방향 사이에서 기준을 정하지 못한 상태에 가깝습니다. 주변의 의견을 모두 만족시키려 하기보다 이 고민에서 가장 중요하게 지키고 싶은 한 가지를 먼저 정해 보세요. 그 기준이 현재의 선택을 비추는 등불이 됩니다.",
    futureReading: "앞으로의 흐름은 한 방향을 분명하게 선택할수록 빠르게 정리됩니다. 결정한 뒤에도 다른 가능성을 계속 돌아보면 마음이 흔들릴 수 있습니다. 충분히 확인한 선택이라면 작은 행동으로 방향을 확정하는 것이 좋습니다.",
  },
  {
    id: "door-key",
    title: "문과 열쇠",
    keywords: "조건 · 기회",
    image: "/oracle/illustrations/door-key.webp",
    currentReading: "기회는 가까이 있지만 아직 갖춰야 할 조건이 하나 남아 있습니다. 무작정 문을 밀기보다 필요한 정보나 준비, 상대의 요구를 정확히 확인해 보세요. 열쇠가 되는 조건을 찾으면 막혀 보이던 상황이 의외로 쉽게 열릴 수 있습니다.",
    futureReading: "앞으로는 준비해 둔 것이 실제 기회로 연결될 가능성이 커집니다. 다만 문이 완전히 열리기 전에는 약속과 조건을 세심하게 살펴야 합니다. 필요한 자격을 갖추고 때를 기다리면 밝은 길로 이어질 수 있습니다.",
  },
  {
    id: "bridge",
    title: "강 위의 다리",
    keywords: "연결 · 화해",
    image: "/oracle/illustrations/bridge.webp",
    currentReading: "이 고민은 혼자 해결하기보다 끊어진 대화나 관계를 다시 잇는 데서 실마리가 나옵니다. 누가 옳은지를 먼저 가리기보다 서로의 입장을 확인할 작은 다리를 놓아 보세요. 짧고 솔직한 표현이 생각보다 큰 변화를 만들 수 있습니다.",
    futureReading: "앞으로는 멀어졌던 두 입장이 다시 만날 여지가 생깁니다. 먼저 손을 내미는 일이 손해처럼 느껴져도 관계의 흐름을 바꾸는 계기가 될 수 있습니다. 서두르지 않고 중간 지점을 찾으면 화해와 협력이 가능합니다.",
  },
  {
    id: "boat-waves",
    title: "파도를 건너는 배",
    keywords: "변화 · 이동",
    image: "/oracle/illustrations/boat-waves.webp",
    currentReading: "지금의 고민은 익숙한 자리에 머무를지 새로운 흐름을 탈지 묻고 있습니다. 변화가 두렵더라도 이미 마음은 다른 방향을 바라보고 있을 수 있습니다. 준비할 것을 챙긴 뒤 움직인다면 파도는 장애가 아니라 이동을 돕는 힘이 됩니다.",
    futureReading: "앞으로는 환경이나 계획이 예상보다 빠르게 바뀔 수 있습니다. 모든 변화를 통제하려 하기보다 중심을 지키며 흐름에 맞춰 조정해 보세요. 목적지를 분명히 기억하면 흔들리는 과정도 결국 전진이 됩니다.",
  },
  {
    id: "pair-cranes",
    title: "한 쌍의 새",
    keywords: "인연 · 동행",
    image: "/oracle/illustrations/pair-cranes.webp",
    currentReading: "지금의 고민에는 함께 방향을 맞출 사람이 중요한 역할을 합니다. 혼자 결론을 내리기보다 믿을 수 있는 상대와 생각을 나누어 보세요. 서로의 속도를 존중할 때 관계도 선택도 더 안정적으로 이어집니다.",
    futureReading: "앞으로는 뜻이 맞는 사람과 함께 움직일 기회가 생길 수 있습니다. 상대를 앞서거나 뒤따르게 하기보다 나란히 갈 수 있는 방식을 찾는 것이 중요합니다. 균형 잡힌 동행은 고민의 부담을 줄이고 선택의 가능성을 넓혀 줍니다.",
  },
  {
    id: "wind-pine",
    title: "바람 속 소나무",
    keywords: "인내 · 지속",
    image: "/oracle/illustrations/pine-tree.webp",
    currentReading: "지금은 상황을 단번에 바꾸기보다 중심을 지키며 버텨야 하는 때입니다. 흔들리는 감정과 주변의 압박 속에서도 처음 세운 기준을 다시 확인해 보세요. 유연하게 조정하되 뿌리까지 움직이지 않는 태도가 필요합니다.",
    futureReading: "앞으로도 잠시 압박이 이어질 수 있지만 쉽게 무너지지는 않습니다. 힘을 한곳에 모으고 불필요한 소모를 줄이면 버티는 시간이 성장으로 바뀝니다. 꾸준함을 유지한 끝에 이전보다 단단한 결과를 얻게 됩니다.",
  },
  {
    id: "grain-jar",
    title: "곡식이 담긴 항아리",
    keywords: "축적 · 재물",
    image: "/oracle/illustrations/grain-jar.webp",
    currentReading: "이 고민은 한 번의 큰 행운보다 지금까지 쌓은 것의 가치를 살펴보라고 말합니다. 시간과 돈, 경험 가운데 이미 충분히 모인 자원이 무엇인지 확인해 보세요. 작은 것을 지키고 정리하는 일이 현재의 안정감을 키웁니다.",
    futureReading: "앞으로는 꾸준히 모아 온 것이 실질적인 도움이 되는 시기가 옵니다. 급한 확장보다 새는 부분을 막고 필요한 곳에 차분히 배분하는 것이 좋습니다. 안정적인 축적이 다음 선택을 가능하게 하는 기반이 됩니다.",
  },
  {
    id: "blooming-peony",
    title: "피어나는 모란",
    keywords: "결실 · 인정",
    image: "/oracle/illustrations/blooming-peony.webp",
    currentReading: "지금까지의 노력은 생각보다 분명한 형태를 갖추고 있습니다. 스스로 부족한 점만 찾기보다 이미 완성된 부분을 세상에 보여줄 때입니다. 성과를 숨기지 않고 정리해 표현하면 필요한 인정이 따라올 수 있습니다.",
    futureReading: "앞으로는 준비해 온 일이 드러나고 평가받을 가능성이 커집니다. 결과를 과장할 필요는 없지만 자신의 몫을 지나치게 낮추지도 마세요. 차분하게 성과를 보여주면 좋은 반응과 다음 기회로 이어질 수 있습니다.",
  },
  {
    id: "mountain-tiger",
    title: "산 위의 호랑이",
    keywords: "용기 · 경계",
    image: "/oracle/illustrations/mountain-tiger.webp",
    currentReading: "지금은 물러서기보다 상황을 넓게 살피며 자신의 자리를 지켜야 합니다. 두려움 때문에 서두르거나 반대로 위험을 무시하지 않도록 균형을 잡아 보세요. 침착한 용기가 현재의 주도권을 되찾게 합니다.",
    futureReading: "앞으로는 분명한 태도를 보여야 할 순간이 찾아올 수 있습니다. 감정적으로 맞서기보다 충분히 관찰한 뒤 필요한 말과 행동만 선택하세요. 경계심과 용기를 함께 사용하면 위험을 줄이며 원하는 방향으로 나아갈 수 있습니다.",
  },
  {
    id: "rainy-field",
    title: "비 내리는 들판",
    keywords: "지연 · 정화",
    image: "/oracle/illustrations/rainy-field.webp",
    currentReading: "지금의 지연은 실패라기보다 흐름을 씻어 내고 정리하는 과정에 가깝습니다. 억지로 속도를 내기보다 복잡한 감정과 조건을 먼저 가라앉혀 보세요. 기다리는 동안 불필요한 것이 정리되면 길이 다시 선명해집니다.",
    futureReading: "앞으로는 답답했던 흐름이 서서히 맑아질 가능성이 있습니다. 당장의 결과보다 정돈과 회복에 집중하면 다음 기회를 받아들일 여유가 생깁니다. 비가 그친 뒤의 들판처럼 상황은 이전보다 깨끗한 기준 위에서 다시 시작됩니다.",
  },
  {
    id: "quiet-mirror",
    title: "고요한 거울",
    keywords: "진실 · 내면",
    image: "/oracle/illustrations/quiet-mirror.webp",
    currentReading: "이 고민의 답은 바깥의 평가보다 이미 마음속에 가까이 있습니다. 감정이 잔잔해질 때까지 결론을 잠시 미루고 자신이 정말 원하는 것을 솔직히 살펴보세요. 불편하지만 외면했던 진실이 현재의 방향을 알려줄 수 있습니다.",
    futureReading: "앞으로는 혼란스럽던 마음이 가라앉으며 선택의 기준이 분명해집니다. 다른 사람에게 답을 구하기 전에 스스로 납득할 수 있는지 확인해 보세요. 내면과 행동이 일치할수록 후회가 적은 결과로 이어집니다.",
  },
] as const;

export function findOracleCard(cardId: string) {
  return ORACLE_CARDS.find((card) => card.id === cardId) ?? null;
}
