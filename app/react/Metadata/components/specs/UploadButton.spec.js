import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {UploadButton} from '../UploadButton';

describe('UploadButton', () => {
  let component;
  let props;
  let context;
  let file = {name: 'fighting__crime--101.pdf'};

  if (typeof File === 'function') {
    file = new File([], 'fighting__crime--101.pdf');
  }


  beforeEach(() => {
    context = {confirm: jasmine.createSpy('confirm')};
    props = {
      progress: Immutable.fromJS({}),
      documentId: 'abc1',
      reuploadDocument: jasmine.createSpy('reuploadDocument')
    };
  });

  let render = () => {
    component = shallow(<UploadButton {...props} />, {context});
  };

  describe('render', () => {
    describe('while upload progress', () => {
      beforeEach(() => {
        props.progress = Immutable.fromJS({abc1: 50});
        render();
      });

      it('should render the progress instead of the input', () => {
        const input = component.find('input');
        expect(input.length).toBe(0);
        const i = component.find('i');
        expect(i.text()).toBe('50%');
      });
    });

    describe('while processing', () => {
      beforeEach(() => {
        render();
        component.setState({processing: true});
      });

      it('should render a processing badge instead of the input', () => {
        const input = component.find('input');
        expect(input.length).toBe(0);
        const div = component.find('div');
        expect(div.text()).toBe('Processing');
      });
    });

    describe('when processing fails', () => {
      beforeEach(() => {
        render();
        component.setState({processing: false, failed: true});
      });

      it('should render a failed badge with the input to reupload', () => {
        const input = component.find('input');
        expect(input.length).toBe(1);
        const label = component.find('label');
        expect(label.text()).toBe('Upload Failed');
      });
    });
  });

  describe('onChange', () => {
    beforeEach(() => {
      render();
    });

    it('should confirm the upload action', () => {
      const input = component.find('input');
      input.simulate('change', {target: {files: [file]}});
      expect(context.confirm).toHaveBeenCalled();
    });

    it('should upload the document', () => {
      const input = component.find('input');
      input.simulate('change', {target: {files: [file]}});
      context.confirm.calls.mostRecent().args[0].accept();
      expect(props.reuploadDocument).toHaveBeenCalledWith('abc1', file);
    });
  });
});
