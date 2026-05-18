import * as React from 'react';
import { IconComponentNode } from './IconComponentNode';
import { Icons2 } from './Icons2';
import { Icons2_1 } from './Icons2_1';
import { Icons2_2 } from './Icons2_2';
import { Icons2_3 } from './Icons2_3';
import { Icons2_4 } from './Icons2_4';

const featureCards = [
  {
    id: 'launch-survey',
    title: 'Запуск опроса за 5 минут',
    Icon: Icons2,
  },
  {
    id: 'research-price',
    title: 'От 1 000 ₽ за исследование',
    Icon: IconComponentNode,
  },
  {
    id: 'target-audience',
    title: 'Таргетированная аудитория',
    Icon: Icons2_1,
  },
  {
    id: 'ai-analytics',
    title: 'ИИ-аналитика в реальном времени',
    Icon: Icons2_2,
  },
  {
    id: 'verified-data',
    title: '97% верифицированных данных',
    Icon: Icons2_3,
  },
  {
    id: 'trusted-respondents',
    title: 'Только проверенные респонденты',
    Icon: Icons2_4,
  },
];

export const Frame: React.FC = () => {
  return (
    <section
      aria-label="Преимущества сервиса"
      className="flex flex-wrap w-[1063px] items-center gap-[20px_20px] relative"
    >
      {featureCards.map(({ id, title, Icon }) => (
        <article
          key={id}
          className="flex flex-col w-[341px] h-[178px] items-start justify-between p-[30px] relative bg-white rounded-[30px] overflow-hidden border-2 border-solid border-[#dad4f2]"
        >
          <div className="relative w-[50px] h-[50px] rounded-[15px] overflow-hidden bg-[linear-gradient(360deg,rgba(100,56,217,1)_0%,rgba(156,125,234,1)_100%)]">
            <Icon className="!absolute !top-[13px] !left-[13px] !w-6 !h-6" />
          </div>
          <p className="relative flex items-center self-stretch [font-family:'Manrope-SemiBold',Helvetica] font-semibold text-black text-xl tracking-[-0.60px] leading-[24.0px]">
            {title}
          </p>
        </article>
      ))}
    </section>
  );
};

export default Frame;
