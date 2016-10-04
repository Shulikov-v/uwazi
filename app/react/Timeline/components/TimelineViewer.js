import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import Loader from 'app/components/Elements/Loader';
import {Link} from 'react-router';
import ShowIf from 'app/App/ShowIf';

import DocumentsAPI from 'app/Documents/DocumentsAPI';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import ReferencesAPI from 'app/Viewer/referencesAPI';

import moment from 'moment';

const countryTemplate = 'e8e039070aa95f8f964c281d450d1022';
const admissibilityReport = 'e8e039070aa95f8f964c281d4583100d';
const judgement = '5c7180d3dd310766a1c6817c165ed5f4';
const orderOfThePresident = 'd0565557e2c6f741bb73738c56868584';
const caseDatesLabels = [
  'Envio a la corte',
  'Presentación ante la comisión',
  'Presentación ante la corte'
];

export class TimelineViewer extends Component {

  getTemplateType(itemTemplate) {
    return this.props.templates.toJS().reduce((result, template, index) => {
      if (template._id === itemTemplate) {
        return 'timeline-item-type-' + index;
      }
      return result;
    }, '');
  }

  fetchReferences(entity) {
    return ReferencesAPI.get(entity._id);
  }

  fetchReferenceData(references) {
    const fetchPromises = references.map(reference => {
      let get;
      if (reference.connectedDocumentType === 'document') {
        get = DocumentsAPI.get;
      }
      if (reference.connectedDocumentType === 'entity') {
        get = EntitiesAPI.get;
      }
      return get(reference.connectedDocument);
    });

    return Promise.all(fetchPromises);
  }

  fetchSecondLevelReferences(references) {
    return Promise.all(references.map(r => ReferencesAPI.get(r.connectedDocument)));
  }

  assignAdditionalData(reference) {
    if (reference.data.template === judgement) {
      reference.additionalData = {type: 'judgement'};
    }

    if (reference.data.template === admissibilityReport) {
      reference.additionalData = {type: 'admissibilityReport'};
    }

    if (reference.data.template === orderOfThePresident) {
      reference.additionalData = {type: 'orderOfThePresident'};
    }

    reference.additionalData.className = this.getTemplateType(reference.data.template);
    reference.additionalData.date = reference.data.metadata.fecha;
  }

  getCaseDates(entity) {
    return entity.metadata.reduce((dates, metadata) => {
      if (caseDatesLabels.indexOf(metadata.label) !== -1) {
        metadata.value.forEach(date => {
          dates.push({label: metadata.label, timestamp: date});
        });
      }
      return dates;
    }, []);
  }

  assignDataToYear(years, date, data) {
    const year = moment.utc(date * 1000).format('YYYY');
    years[year] = years[year] || [];
    years[year].push(data);
  }

  normalizeYears(years) {
    const minYear = Object.keys(years).reduce((min, year) => {
      return Math.min(min, Number(year));
    }, Number(moment().format('YYYY')));

    const maxYear = Object.keys(years).reduce((max, year) => {
      return Math.max(max, Number(year));
    }, minYear);

    for (let year = minYear - 3; year < maxYear + 4; year += 1) {
      years[year] = years[year] || [];
    }

    return years;
  }

  arrangeYears(references, caseDates) {
    let years = {};
    references.forEach(reference => {
      const isDesiredTemplate = reference.data.template === admissibilityReport ||
                                reference.data.template === judgement ||
                                reference.data.template === orderOfThePresident;
      const hasDate = reference.data.metadata.fecha !== null;
      if (isDesiredTemplate && hasDate) {
        this.assignDataToYear(years, reference.data.metadata.fecha, reference);
        this.assignAdditionalData(reference);
      }
    });

    caseDates.forEach(date => {
      this.assignDataToYear(years, date.timestamp, date);
    });

    return this.normalizeYears(years);
  }

  getTimelineInfo(entity) {
    let usefulReferences;

    this.fetchReferences(entity)
    .then(references => {
      usefulReferences = references.filter(r => r.connectedDocumentTemplate !== countryTemplate);
      return this.fetchReferenceData(usefulReferences);
    })
    .then(referencesData => {
      return Promise.all([referencesData, this.fetchSecondLevelReferences(usefulReferences)]);
    })
    .then(([referencesData, secondLevelReferences]) => {
      const conformedReferences = usefulReferences.map((reference, index) => {
        return {reference, data: referencesData[index][0], children: secondLevelReferences[index]};
      });

      this.setState({
        references: conformedReferences,
        years: this.arrangeYears(conformedReferences, this.getCaseDates(entity))
      });
    });
  }

  componentDidMount() {
    this.getTimelineInfo(this.props.entity);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.entity._id !== nextProps.entity._id) {
      this.setState({years: null}, () => {
        this.getTimelineInfo(nextProps.entity);
      });
    }
  }

  render() {
    let years = '';
    if (this.state && this.state.years) {
      years = Object.keys(this.state.years).map(year =>
        <div key={year} className="timeline-year">
          <div className={`timeline-label ${year % 5 === 0 ? 'timeline-label-text' : ''}`}>
            <span>{year}</span>
          </div>
          {this.state.years[year].map((reference, index) => {
            if (reference.reference) {
              return (
                <Link to={`/${reference.reference.connectedDocumentType}/${reference.data._id}`}
                      key={index}
                      className={`timeline-item ${reference.additionalData.className}`}
                      data-toggle="tooltip"
                      data-placement="top"
                      data-animation="false"
                      title={`${moment.utc(reference.additionalData.date * 1000).format('ll')}\n${reference.data.title}`}>
                  <ShowIf if={reference.additionalData.type === 'judgement'}>
                    <i className="fa fa-legal"></i>
                  </ShowIf>
                </Link>
              );
            }

            if (!reference.reference) {
              return (
                <span key={index}
                      className="timeline-item"
                      data-toggle="tooltip"
                      data-placement="top"
                      data-animation="false"
                      title={`${moment.utc(reference.timestamp * 1000).format('ll')}\n${reference.label}`}>
                </span>
              );
            }
          })}
        </div>
      );
    }
    return (
      <div className="timeline">
        {(() => {
          if (!this.state || !this.state.years) {
            return <Loader/>;
          }
        })()}
        {years}
      </div>
    );
  }
}

TimelineViewer.propTypes = {
  entity: PropTypes.object,
  references: PropTypes.object,
  templates: PropTypes.object
};

function mapStateToProps({templates}) {
  return {templates};
}

export default connect(mapStateToProps)(TimelineViewer);
