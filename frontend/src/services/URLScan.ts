import { ScanProps, ServerResponse } from '../types';
import api from '../API/Index';

const urlScanAPI = async (props: ScanProps) => {
  try {
    // const formData = new FormData();
    const payload = {};
    let s3url: string = '';
    if (props.source_type === 's3 bucket') {
      if (!props.urlParam?.endsWith('/')) {
        s3url = `${props?.urlParam}/`;
      } else {
        s3url = props?.urlParam;
      }
    }
    if (props.source_type === 's3 bucket') {
      payload.source_url = s3url;
      // formData.append('source_url', s3url ?? '');
    } else {
      payload.source_url = props?.urlParam;

      // formData.append('source_url', props?.urlParam ?? '');
    }
    payload.wiki_query = decodeURIComponent(props?.wikiquery ?? '');
    // formData.append('wiki_query', decodeURIComponent(props?.wikiquery ?? ''));
    payload.source_type = props?.source_type ?? '';
    // formData.append('source_type', props?.source_type ?? '');
    if (props.model != undefined) {
      payload.model = props?.model;
      // formData.append('model', props?.model);
    }
    if (props.accessKey?.length) {
      payload.aws_access_key_id = props?.accessKey;
      // formData.append('aws_access_key_id', props?.accessKey);
    }
    if (props?.secretKey?.length) {
      payload.aws_secret_access_key = props?.secretKey;
      // formData.append('aws_secret_access_key', props?.secretKey);
    }
    if (props?.gcs_bucket_name) {
      payload.gcs_bucket_name = props.gcs_bucket_name;
      // formData.append('gcs_bucket_name', props.gcs_bucket_name);
    }
    if (props?.gcs_bucket_folder) {
      payload.gcs_bucket_folder = props.gcs_bucket_folder;
      // formData.append('gcs_bucket_folder', props.gcs_bucket_folder);
    }
    if (props?.gcs_project_id) {
      payload.gcs_project_id = props.gcs_project_id;
      // formData.append('gcs_project_id', props.gcs_project_id);
    }
    if (props?.access_token) {
      payload.access_token = props.access_token;
      // formData.append('access_token', props.access_token);
    }

    const response: ServerResponse = await api.post(`/url/scan`, payload);
    return response;
  } catch (error) {
    console.log('Error uploading file:', error);
    throw error;
  }
};

export { urlScanAPI };
