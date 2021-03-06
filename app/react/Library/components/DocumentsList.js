import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {fromJS as Immutable} from 'immutable';
import {createSelector} from 'reselect';

import Doc from 'app/Library/components/Doc';
import SortButtons from 'app/Library/components/SortButtons';
import {RowList} from 'app/Layout/Lists';
import {loadMoreDocuments} from 'app/Library/actions/libraryActions';
import Loader from 'app/components/Elements/Loader';
import Footer from 'app/App/Footer';
import {t} from 'app/I18N';

const selectDocuments = createSelector(s => s.library.documents, d => d.toJS());
const loadMoreAmmount = 30;

export class DocumentsList extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {loading: false};
  }

  loadMoreDocuments() {
    this.setState({loading: true});
    this.props.loadMoreDocuments(this.props.documents.rows.length + loadMoreAmmount);
  }

  componentWillReceiveProps() {
    this.setState({loading: false});
  }

  render() {
    const documents = this.props.documents;

    return (
      <main className="document-viewer with-panel">
        <div className="main-wrapper">
          <div className="sort-by">
              <div className="u-floatLeft documents-counter">
                <b>{documents.totalRows}</b> {t('System', 'documents')}
              </div>
              <SortButtons sortCallback={this.props.searchDocuments}
                           selectedTemplates={this.props.filters.get('documentTypes')} />
          </div>
          <RowList>
            {documents.rows.map((doc, index) => <Doc doc={Immutable(doc)} key={index} searchParams={this.props.search} />)}
          </RowList>
          <div className="row">
            <div className="col-sm-12 text-center documents-counter">
                <b>{documents.rows.length}</b>
                {` ${t('System', 'of')} `}
                <b>{documents.totalRows}</b>
                {` ${t('System', 'documents')}`}
            </div>
            {(() => {
              if (documents.rows.length < documents.totalRows && !this.state.loading) {
                return <div className="col-sm-12 text-center">
                <button onClick={this.loadMoreDocuments.bind(this)} className="btn btn-default btn-load-more">
                  {loadMoreAmmount + ' ' + t('System', 'x more')}
                </button>
                </div>;
              }
              if (this.state.loading) {
                return <Loader/>;
              }
            })()}
          </div>
          <Footer/>
        </div>
      </main>
    );
  }
}

DocumentsList.propTypes = {
  documents: PropTypes.object.isRequired,
  filters: PropTypes.object,
  filtersPanel: PropTypes.bool,
  selectedDocument: PropTypes.object,
  search: PropTypes.object,
  loadMoreDocuments: PropTypes.func,
  searchDocuments: PropTypes.func
};

export function mapStateToProps(state) {
  return {
    documents: selectDocuments(state),
    filters: state.library.filters,
    filtersPanel: state.library.ui.get('filtersPanel'),
    selectedDocument: state.library.ui.get('selectedDocument'),
    search: state.search
  };
}


function mapDispatchToProps(dispatch) {
  return bindActionCreators({loadMoreDocuments, searchDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);
