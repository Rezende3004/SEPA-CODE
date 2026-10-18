import { http, HttpResponse } from 'msw';
import type { InstituicaoPublica } from '@/shared/types';
import { db } from '../db';
import { aguardar } from '../lib/http';

export const instituicoesHandlers = [
  http.get('*/api/instituicoes/', async () => {
    await aguardar();
    const instituicoes: InstituicaoPublica[] = db.instituicoes
      .filter((item) => item.statusAssinatura === 'ATIVA')
      .map((item) => ({ id: item.id, nomeFantasia: item.nomeFantasia }));
    return HttpResponse.json(instituicoes);
  }),
];
