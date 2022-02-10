/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { mount } from 'enzyme';
import React from 'react';

import '../../../common/mock/match_media';
import {
  mockGlobalState,
  TestProviders,
  SUB_PLUGINS_REDUCER,
  kibanaObservable,
  createSecuritySolutionStorageMock,
} from '../../../common/mock';
import { createStore, State } from '../../../common/store';
import { DetailsPanel } from './index';
import {
  TimelineExpandedDetail,
  TimelineId,
  TimelineTabs,
} from '../../../../common/types/timeline';
import { FlowTarget } from '../../../../common/search_strategy/security_solution/network';
import { EventDetailsPanel } from './event_details';

jest.mock('../../../common/lib/kibana');

describe('Details Panel Component', () => {
  const state: State = {
    ...mockGlobalState,
    timeline: {
      ...mockGlobalState.timeline,
      timelineById: {
        ...mockGlobalState.timeline.timelineById,
        [TimelineId.active]: mockGlobalState.timeline.timelineById.test,
      },
    },
  };

  const { storage } = createSecuritySolutionStorageMock();
  let store = createStore(state, SUB_PLUGINS_REDUCER, kibanaObservable, storage);

  const dataLessExpandedDetail = {
    [TimelineTabs.query]: {
      panelView: 'hostDetail',
      params: {},
    },
  };

  const hostExpandedDetail: TimelineExpandedDetail = {
    [TimelineTabs.query]: {
      panelView: 'hostDetail',
      params: {
        hostName: 'woohoo!',
      },
    },
  };

  const networkExpandedDetail: TimelineExpandedDetail = {
    [TimelineTabs.query]: {
      panelView: 'networkDetail',
      params: {
        ip: 'woohoo!',
        flowTarget: FlowTarget.source,
      },
    },
  };

  const eventExpandedDetail: TimelineExpandedDetail = {
    [TimelineTabs.query]: {
      panelView: 'eventDetail',
      params: {
        eventId: 'my-id',
        indexName: 'my-index',
      },
    },
  };

  const eventPinnedExpandedDetail: TimelineExpandedDetail = {
    [TimelineTabs.pinned]: {
      panelView: 'eventDetail',
      params: {
        eventId: 'my-id',
        indexName: 'my-index',
      },
    },
  };

  const mockProps = {
    browserFields: {},
    docValueFields: [],
    handleOnPanelClosed: jest.fn(),
    isFlyoutView: false,
    runtimeMappings: {},
    tabType: TimelineTabs.query,
    timelineId: 'test',
  };

  describe('DetailsPanel: rendering', () => {
    beforeEach(() => {
      store = createStore(state, SUB_PLUGINS_REDUCER, kibanaObservable, storage);
    });

    test('it should not render the DetailsPanel if no expanded detail has been set in the reducer', () => {
      const wrapper = mount(
        <TestProviders store={store}>
          <DetailsPanel {...mockProps} />
        </TestProviders>
      );

      expect(wrapper.find('DetailsPanel')).toMatchSnapshot();
    });

    test('it should not render the DetailsPanel if an expanded detail with a panelView, but not params have been set', () => {
      state.timeline.timelineById.test.expandedDetail =
        dataLessExpandedDetail as TimelineExpandedDetail; // Casting as the dataless doesn't meet the actual type requirements
      const wrapper = mount(
        <TestProviders store={store}>
          <DetailsPanel {...mockProps} />
        </TestProviders>
      );

      expect(wrapper.find('DetailsPanel')).toMatchSnapshot(`
        <DetailsPanel
          browserFields={Object {}}
          docValueFields={Array []}
          handleOnPanelClosed={[MockFunction]}
          isFlyoutView={false}
          runtimeMappings={Object {}}
          tabType="query"
          timelineId="test"
        />
      `);
    });
  });

  describe('DetailsPanel:EventDetails: rendering', () => {
    beforeEach(() => {
      const mockState = { ...state };
      mockState.timeline.timelineById[TimelineId.active].expandedDetail = eventExpandedDetail;
      mockState.timeline.timelineById.test.expandedDetail = eventExpandedDetail;
      store = createStore(mockState, SUB_PLUGINS_REDUCER, kibanaObservable, storage);
    });

    test('it should render the Event Details Panel when the panelView is set and the associated params are set', () => {
      const wrapper = mount(
        <TestProviders store={store}>
          <DetailsPanel {...mockProps} />
        </TestProviders>
      );

      expect(wrapper.find('EventDetailsPanelComponent')).toMatchSnapshot();
    });

    test('it should render the Event Details view of the Details Panel in the flyout when the panelView is eventDetail and the eventId is set', () => {
      const currentProps = { ...mockProps, isFlyoutView: true };
      const wrapper = mount(
        <TestProviders store={store}>
          <DetailsPanel {...currentProps} />
        </TestProviders>
      );

      expect(wrapper.find('[data-test-subj="timeline:details-panel:flyout"]')).toMatchSnapshot();
      expect(wrapper.find('[data-test-subj="timeline:details-panel:flyout"]'))
        .toMatchInlineSnapshot(`
        Array [
          .c0 {
          -webkit-flex: 0 1 auto;
          -ms-flex: 0 1 auto;
          flex: 0 1 auto;
          margin-top: 8px;
        }

        .c1 .euiFlyoutBody__overflow {
          display: -webkit-box;
          display: -webkit-flex;
          display: -ms-flexbox;
          display: flex;
          -webkit-flex: 1;
          -ms-flex: 1;
          flex: 1;
          overflow: hidden;
        }

        .c1 .euiFlyoutBody__overflow .euiFlyoutBody__overflowContent {
          -webkit-flex: 1;
          -ms-flex: 1;
          flex: 1;
          overflow: hidden;
          padding: 0 16px 16px;
        }

        <EuiFlyout
            data-test-subj="timeline:details-panel:flyout"
            onClose={[Function]}
            ownFocus={false}
            size="m"
          >
            <div
              data-eui="EuiFlyout"
              data-test-subj="timeline:details-panel:flyout"
              role="dialog"
            >
              <button
                data-test-subj="euiFlyoutCloseButton"
                onClick={[Function]}
                type="button"
              />
              <EventDetailsPanelComponent
                browserFields={Object {}}
                docValueFields={Array []}
                expandedEvent={
                  Object {
                    "eventId": "my-id",
                    "indexName": "my-index",
                  }
                }
                handleOnEventClosed={[Function]}
                isDraggable={false}
                isFlyoutView={true}
                runtimeMappings={Object {}}
                tabType="query"
                timelineId="test"
              >
                <EuiFlyoutHeader
                  hasBorder={false}
                >
                  <div
                    className="euiFlyoutHeader"
                  >
                    <Memo(EventDetailsFlyoutHeaderComponent)
                      activePanel={null}
                      isAlert={false}
                      isolateAction="isolateHost"
                      loading={true}
                      ruleName=""
                      showAlertDetails={[Function]}
                      timestamp=""
                    >
                      <ExpandableEventTitle
                        isAlert={false}
                        loading={true}
                        ruleName=""
                        timestamp=""
                      >
                        <Styled(EuiFlexGroup)
                          gutterSize="none"
                          justifyContent="spaceBetween"
                          wrap={true}
                        >
                          <EuiFlexGroup
                            className="c0"
                            gutterSize="none"
                            justifyContent="spaceBetween"
                            wrap={true}
                          >
                            <div
                              className="euiFlexGroup euiFlexGroup--justifyContentSpaceBetween euiFlexGroup--directionRow euiFlexGroup--responsive euiFlexGroup--wrap c0"
                            >
                              <EuiFlexItem
                                grow={false}
                              >
                                <div
                                  className="euiFlexItem euiFlexItem--flexGrowZero"
                                />
                              </EuiFlexItem>
                            </div>
                          </EuiFlexGroup>
                        </Styled(EuiFlexGroup)>
                      </ExpandableEventTitle>
                    </Memo(EventDetailsFlyoutHeaderComponent)>
                  </div>
                </EuiFlyoutHeader>
                <Styled(EuiFlyoutBody)>
                  <EuiFlyoutBody
                    className="c1"
                  >
                    <div
                      className="euiFlyoutBody c1"
                    >
                      <div
                        className="euiFlyoutBody__overflow"
                        tabIndex={0}
                      >
                        <div
                          className="euiFlyoutBody__overflowContent"
                        >
                          <Memo(EventDetailsFlyoutBodyComponent)
                            activePanel={null}
                            browserFields={Object {}}
                            detailsData={null}
                            expandedEvent={
                              Object {
                                "eventId": "my-id",
                                "indexName": "my-index",
                              }
                            }
                            handleIsolationActionSuccess={[Function]}
                            handleOnEventClosed={[Function]}
                            hostRisk={null}
                            isAlert={false}
                            isDraggable={false}
                            isolateAction="isolateHost"
                            loading={true}
                            showAlertDetails={[Function]}
                            timelineId="test"
                          >
                            <ExpandableEvent
                              browserFields={Object {}}
                              detailsData={null}
                              event={
                                Object {
                                  "eventId": "my-id",
                                  "indexName": "my-index",
                                }
                              }
                              handleOnEventClosed={[Function]}
                              hostRisk={null}
                              isAlert={false}
                              isDraggable={false}
                              loading={true}
                              timelineId="test"
                              timelineTabType="flyout"
                            >
                              <EuiLoadingContent
                                lines={10}
                              >
                                <span
                                  className="euiLoadingContent"
                                >
                                  <span
                                    className="euiLoadingContent__singleLine"
                                    key="0"
                                  >
                                    <span
                                      className="euiLoadingContent__singleLineBackground"
                                    />
                                  </span>
                                  <span
                                    className="euiLoadingContent__singleLine"
                                    key="1"
                                  >
                                    <span
                                      className="euiLoadingContent__singleLineBackground"
                                    />
                                  </span>
                                  <span
                                    className="euiLoadingContent__singleLine"
                                    key="2"
                                  >
                                    <span
                                      className="euiLoadingContent__singleLineBackground"
                                    />
                                  </span>
                                  <span
                                    className="euiLoadingContent__singleLine"
                                    key="3"
                                  >
                                    <span
                                      className="euiLoadingContent__singleLineBackground"
                                    />
                                  </span>
                                  <span
                                    className="euiLoadingContent__singleLine"
                                    key="4"
                                  >
                                    <span
                                      className="euiLoadingContent__singleLineBackground"
                                    />
                                  </span>
                                  <span
                                    className="euiLoadingContent__singleLine"
                                    key="5"
                                  >
                                    <span
                                      className="euiLoadingContent__singleLineBackground"
                                    />
                                  </span>
                                  <span
                                    className="euiLoadingContent__singleLine"
                                    key="6"
                                  >
                                    <span
                                      className="euiLoadingContent__singleLineBackground"
                                    />
                                  </span>
                                  <span
                                    className="euiLoadingContent__singleLine"
                                    key="7"
                                  >
                                    <span
                                      className="euiLoadingContent__singleLineBackground"
                                    />
                                  </span>
                                  <span
                                    className="euiLoadingContent__singleLine"
                                    key="8"
                                  >
                                    <span
                                      className="euiLoadingContent__singleLineBackground"
                                    />
                                  </span>
                                  <span
                                    className="euiLoadingContent__singleLine"
                                    key="9"
                                  >
                                    <span
                                      className="euiLoadingContent__singleLineBackground"
                                    />
                                  </span>
                                </span>
                              </EuiLoadingContent>
                            </ExpandableEvent>
                          </Memo(EventDetailsFlyoutBodyComponent)>
                        </div>
                      </div>
                    </div>
                  </EuiFlyoutBody>
                </Styled(EuiFlyoutBody)>
                <Memo(EventDetailsFlyoutFooterComponent)
                  activePanel={null}
                  detailsData={null}
                  ecsData={null}
                  expandedEvent={
                    Object {
                      "eventId": "my-id",
                      "indexName": "my-index",
                    }
                  }
                  handleOnEventClosed={[Function]}
                  loading={true}
                  setActivePanel={[Function]}
                  showAlertDetails={[Function]}
                  showHostIsolationPanel={[Function]}
                  timelineId="test"
                >
                  <Connect(Component)
                    detailsData={null}
                    detailsEcsData={null}
                    expandedEvent={
                      Object {
                        "eventId": "my-id",
                        "indexName": "my-index",
                      }
                    }
                    handleOnEventClosed={[Function]}
                    handlePanelChange={[Function]}
                    isHostIsolationPanelOpen={false}
                    loadingEventDetails={true}
                    onAddIsolationStatusClick={[Function]}
                    timelineId="test"
                  >
                    <Memo()
                      detailsData={null}
                      detailsEcsData={null}
                      dispatch={[Function]}
                      expandedEvent={
                        Object {
                          "eventId": "my-id",
                          "indexName": "my-index",
                        }
                      }
                      globalQuery={Array []}
                      handleOnEventClosed={[Function]}
                      handlePanelChange={[Function]}
                      isHostIsolationPanelOpen={false}
                      loadingEventDetails={true}
                      onAddIsolationStatusClick={[Function]}
                      timelineId="test"
                      timelineQuery={
                        Object {
                          "id": "",
                          "inspect": null,
                          "isInspected": false,
                          "loading": false,
                          "refetch": null,
                          "selectedInspectIndex": 0,
                        }
                      }
                    >
                      <EuiFlyoutFooter>
                        <div
                          className="euiFlyoutFooter"
                        >
                          <EuiFlexGroup
                            justifyContent="flexEnd"
                          >
                            <div
                              className="euiFlexGroup euiFlexGroup--gutterLarge euiFlexGroup--justifyContentFlexEnd euiFlexGroup--directionRow euiFlexGroup--responsive"
                            >
                              <EuiFlexItem
                                grow={false}
                              >
                                <div
                                  className="euiFlexItem euiFlexItem--flexGrowZero"
                                />
                              </EuiFlexItem>
                            </div>
                          </EuiFlexGroup>
                        </div>
                      </EuiFlyoutFooter>
                    </Memo()>
                  </Connect(Component)>
                </Memo(EventDetailsFlyoutFooterComponent)>
              </EventDetailsPanelComponent>
            </div>
          </EuiFlyout>,
          .c0 {
          -webkit-flex: 0 1 auto;
          -ms-flex: 0 1 auto;
          flex: 0 1 auto;
          margin-top: 8px;
        }

        .c1 .euiFlyoutBody__overflow {
          display: -webkit-box;
          display: -webkit-flex;
          display: -ms-flexbox;
          display: flex;
          -webkit-flex: 1;
          -ms-flex: 1;
          flex: 1;
          overflow: hidden;
        }

        .c1 .euiFlyoutBody__overflow .euiFlyoutBody__overflowContent {
          -webkit-flex: 1;
          -ms-flex: 1;
          flex: 1;
          overflow: hidden;
          padding: 0 16px 16px;
        }

        <div
            data-eui="EuiFlyout"
            data-test-subj="timeline:details-panel:flyout"
            role="dialog"
          >
            <button
              data-test-subj="euiFlyoutCloseButton"
              onClick={[Function]}
              type="button"
            />
            <EventDetailsPanelComponent
              browserFields={Object {}}
              docValueFields={Array []}
              expandedEvent={
                Object {
                  "eventId": "my-id",
                  "indexName": "my-index",
                }
              }
              handleOnEventClosed={[Function]}
              isDraggable={false}
              isFlyoutView={true}
              runtimeMappings={Object {}}
              tabType="query"
              timelineId="test"
            >
              <EuiFlyoutHeader
                hasBorder={false}
              >
                <div
                  className="euiFlyoutHeader"
                >
                  <Memo(EventDetailsFlyoutHeaderComponent)
                    activePanel={null}
                    isAlert={false}
                    isolateAction="isolateHost"
                    loading={true}
                    ruleName=""
                    showAlertDetails={[Function]}
                    timestamp=""
                  >
                    <ExpandableEventTitle
                      isAlert={false}
                      loading={true}
                      ruleName=""
                      timestamp=""
                    >
                      <Styled(EuiFlexGroup)
                        gutterSize="none"
                        justifyContent="spaceBetween"
                        wrap={true}
                      >
                        <EuiFlexGroup
                          className="c0"
                          gutterSize="none"
                          justifyContent="spaceBetween"
                          wrap={true}
                        >
                          <div
                            className="euiFlexGroup euiFlexGroup--justifyContentSpaceBetween euiFlexGroup--directionRow euiFlexGroup--responsive euiFlexGroup--wrap c0"
                          >
                            <EuiFlexItem
                              grow={false}
                            >
                              <div
                                className="euiFlexItem euiFlexItem--flexGrowZero"
                              />
                            </EuiFlexItem>
                          </div>
                        </EuiFlexGroup>
                      </Styled(EuiFlexGroup)>
                    </ExpandableEventTitle>
                  </Memo(EventDetailsFlyoutHeaderComponent)>
                </div>
              </EuiFlyoutHeader>
              <Styled(EuiFlyoutBody)>
                <EuiFlyoutBody
                  className="c1"
                >
                  <div
                    className="euiFlyoutBody c1"
                  >
                    <div
                      className="euiFlyoutBody__overflow"
                      tabIndex={0}
                    >
                      <div
                        className="euiFlyoutBody__overflowContent"
                      >
                        <Memo(EventDetailsFlyoutBodyComponent)
                          activePanel={null}
                          browserFields={Object {}}
                          detailsData={null}
                          expandedEvent={
                            Object {
                              "eventId": "my-id",
                              "indexName": "my-index",
                            }
                          }
                          handleIsolationActionSuccess={[Function]}
                          handleOnEventClosed={[Function]}
                          hostRisk={null}
                          isAlert={false}
                          isDraggable={false}
                          isolateAction="isolateHost"
                          loading={true}
                          showAlertDetails={[Function]}
                          timelineId="test"
                        >
                          <ExpandableEvent
                            browserFields={Object {}}
                            detailsData={null}
                            event={
                              Object {
                                "eventId": "my-id",
                                "indexName": "my-index",
                              }
                            }
                            handleOnEventClosed={[Function]}
                            hostRisk={null}
                            isAlert={false}
                            isDraggable={false}
                            loading={true}
                            timelineId="test"
                            timelineTabType="flyout"
                          >
                            <EuiLoadingContent
                              lines={10}
                            >
                              <span
                                className="euiLoadingContent"
                              >
                                <span
                                  className="euiLoadingContent__singleLine"
                                  key="0"
                                >
                                  <span
                                    className="euiLoadingContent__singleLineBackground"
                                  />
                                </span>
                                <span
                                  className="euiLoadingContent__singleLine"
                                  key="1"
                                >
                                  <span
                                    className="euiLoadingContent__singleLineBackground"
                                  />
                                </span>
                                <span
                                  className="euiLoadingContent__singleLine"
                                  key="2"
                                >
                                  <span
                                    className="euiLoadingContent__singleLineBackground"
                                  />
                                </span>
                                <span
                                  className="euiLoadingContent__singleLine"
                                  key="3"
                                >
                                  <span
                                    className="euiLoadingContent__singleLineBackground"
                                  />
                                </span>
                                <span
                                  className="euiLoadingContent__singleLine"
                                  key="4"
                                >
                                  <span
                                    className="euiLoadingContent__singleLineBackground"
                                  />
                                </span>
                                <span
                                  className="euiLoadingContent__singleLine"
                                  key="5"
                                >
                                  <span
                                    className="euiLoadingContent__singleLineBackground"
                                  />
                                </span>
                                <span
                                  className="euiLoadingContent__singleLine"
                                  key="6"
                                >
                                  <span
                                    className="euiLoadingContent__singleLineBackground"
                                  />
                                </span>
                                <span
                                  className="euiLoadingContent__singleLine"
                                  key="7"
                                >
                                  <span
                                    className="euiLoadingContent__singleLineBackground"
                                  />
                                </span>
                                <span
                                  className="euiLoadingContent__singleLine"
                                  key="8"
                                >
                                  <span
                                    className="euiLoadingContent__singleLineBackground"
                                  />
                                </span>
                                <span
                                  className="euiLoadingContent__singleLine"
                                  key="9"
                                >
                                  <span
                                    className="euiLoadingContent__singleLineBackground"
                                  />
                                </span>
                              </span>
                            </EuiLoadingContent>
                          </ExpandableEvent>
                        </Memo(EventDetailsFlyoutBodyComponent)>
                      </div>
                    </div>
                  </div>
                </EuiFlyoutBody>
              </Styled(EuiFlyoutBody)>
              <Memo(EventDetailsFlyoutFooterComponent)
                activePanel={null}
                detailsData={null}
                ecsData={null}
                expandedEvent={
                  Object {
                    "eventId": "my-id",
                    "indexName": "my-index",
                  }
                }
                handleOnEventClosed={[Function]}
                loading={true}
                setActivePanel={[Function]}
                showAlertDetails={[Function]}
                showHostIsolationPanel={[Function]}
                timelineId="test"
              >
                <Connect(Component)
                  detailsData={null}
                  detailsEcsData={null}
                  expandedEvent={
                    Object {
                      "eventId": "my-id",
                      "indexName": "my-index",
                    }
                  }
                  handleOnEventClosed={[Function]}
                  handlePanelChange={[Function]}
                  isHostIsolationPanelOpen={false}
                  loadingEventDetails={true}
                  onAddIsolationStatusClick={[Function]}
                  timelineId="test"
                >
                  <Memo()
                    detailsData={null}
                    detailsEcsData={null}
                    dispatch={[Function]}
                    expandedEvent={
                      Object {
                        "eventId": "my-id",
                        "indexName": "my-index",
                      }
                    }
                    globalQuery={Array []}
                    handleOnEventClosed={[Function]}
                    handlePanelChange={[Function]}
                    isHostIsolationPanelOpen={false}
                    loadingEventDetails={true}
                    onAddIsolationStatusClick={[Function]}
                    timelineId="test"
                    timelineQuery={
                      Object {
                        "id": "",
                        "inspect": null,
                        "isInspected": false,
                        "loading": false,
                        "refetch": null,
                        "selectedInspectIndex": 0,
                      }
                    }
                  >
                    <EuiFlyoutFooter>
                      <div
                        className="euiFlyoutFooter"
                      >
                        <EuiFlexGroup
                          justifyContent="flexEnd"
                        >
                          <div
                            className="euiFlexGroup euiFlexGroup--gutterLarge euiFlexGroup--justifyContentFlexEnd euiFlexGroup--directionRow euiFlexGroup--responsive"
                          >
                            <EuiFlexItem
                              grow={false}
                            >
                              <div
                                className="euiFlexItem euiFlexItem--flexGrowZero"
                              />
                            </EuiFlexItem>
                          </div>
                        </EuiFlexGroup>
                      </div>
                    </EuiFlyoutFooter>
                  </Memo()>
                </Connect(Component)>
              </Memo(EventDetailsFlyoutFooterComponent)>
            </EventDetailsPanelComponent>
          </div>,
        ]
      `);
    });

    test('it should have the attributes isDraggable to be false when timelineId !== "active" and activeTab === "query"', () => {
      const wrapper = mount(
        <TestProviders store={store}>
          <DetailsPanel {...mockProps} />
        </TestProviders>
      );
      expect(wrapper.find(EventDetailsPanel).props().isDraggable).toBeFalsy();
    });

    test('it should have the attributes isDraggable to be true when timelineId === "active" and activeTab === "query"', () => {
      const currentProps = { ...mockProps, timelineId: TimelineId.active };
      const wrapper = mount(
        <TestProviders store={store}>
          <DetailsPanel {...currentProps} />
        </TestProviders>
      );
      expect(wrapper.find(EventDetailsPanel).props().isDraggable).toBeTruthy();
    });
  });

  describe('DetailsPanel:EventDetails: rendering in pinned tab', () => {
    beforeEach(() => {
      const mockState = { ...state };
      mockState.timeline.timelineById[TimelineId.active].activeTab = TimelineTabs.pinned;
      mockState.timeline.timelineById[TimelineId.active].expandedDetail = eventPinnedExpandedDetail;
      mockState.timeline.timelineById.test.expandedDetail = eventPinnedExpandedDetail;
      mockState.timeline.timelineById.test.activeTab = TimelineTabs.pinned;
      store = createStore(mockState, SUB_PLUGINS_REDUCER, kibanaObservable, storage);
    });

    test('it should have the attributes isDraggable to be false when timelineId !== "active" and activeTab === "pinned"', () => {
      const currentProps = { ...mockProps, tabType: TimelineTabs.pinned };
      const wrapper = mount(
        <TestProviders store={store}>
          <DetailsPanel {...currentProps} />
        </TestProviders>
      );
      expect(wrapper.find(EventDetailsPanel).props().isDraggable).toBeFalsy();
    });

    test('it should have the attributes isDraggable to be false when timelineId === "active" and activeTab === "pinned"', () => {
      const currentProps = {
        ...mockProps,
        tabType: TimelineTabs.pinned,
        timelineId: TimelineId.active,
      };
      const wrapper = mount(
        <TestProviders store={store}>
          <DetailsPanel {...currentProps} />
        </TestProviders>
      );
      expect(wrapper.find(EventDetailsPanel).props().isDraggable).toBeFalsy();
    });
  });

  describe('DetailsPanel:HostDetails: rendering', () => {
    beforeEach(() => {
      const mockState = { ...state };
      mockState.timeline.timelineById[TimelineId.active].expandedDetail = hostExpandedDetail;
      mockState.timeline.timelineById.test.expandedDetail = hostExpandedDetail;
      store = createStore(mockState, SUB_PLUGINS_REDUCER, kibanaObservable, storage);
    });

    test('it should render the Host Details view in the Details Panel when the panelView is hostDetail and the hostName is set', () => {
      const wrapper = mount(
        <TestProviders store={store}>
          <DetailsPanel {...mockProps} />
        </TestProviders>
      );

      expect(wrapper.find('ExpandableHostDetails')).toMatchSnapshot();
    });
  });

  describe('DetailsPanel:NetworkDetails: rendering', () => {
    beforeEach(() => {
      const mockState = { ...state };
      mockState.timeline.timelineById[TimelineId.active].expandedDetail = networkExpandedDetail;
      mockState.timeline.timelineById.test.expandedDetail = networkExpandedDetail;
      store = createStore(mockState, SUB_PLUGINS_REDUCER, kibanaObservable, storage);
    });

    test('it should render the Network Details view in the Details Panel when the panelView is networkDetail and the ip is set', () => {
      const wrapper = mount(
        <TestProviders store={store}>
          <DetailsPanel {...mockProps} />
        </TestProviders>
      );

      expect(wrapper.find('ExpandableNetworkDetails')).toMatchSnapshot();
    });
  });
});
