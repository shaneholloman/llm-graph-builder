import { MetricsResponse } from '../types';
// import api from '../API/Index';
import axios from 'axios';
import { url } from '../utils/Utils';

export const getChatMetrics = async (
  question: string,
  context: string[],
  answer: string[],
  model: string,
  mode: string[],
  referenceText?:string
) => {
  // const formData = new FormData();
  // formData.append('question', question);
  // formData.append('context', JSON.stringify(context));
  // formData.append('answer', JSON.stringify(answer));
  // formData.append('model', model);
  // formData.append('mode', JSON.stringify(mode));
  try {
    const response = await axios.post<MetricsResponse>(`${url()}/ragas_metrics`, {
      question,
      context,
      answer,
      model,
      mode,
      reference:referenceText
    });
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
